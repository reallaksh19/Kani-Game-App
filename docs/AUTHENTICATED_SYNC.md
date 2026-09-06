# Authenticated Kani learner sync

Status: **Stages 1–5 code foundation implemented; hosted deployment/auth activation still blocked on real Supabase infrastructure**. Architecture decision: Study-Hub #15. Implementation epic: Study-Hub #18.

## Boundary

Kani remains a local-first learner application. `kani-content-v1` and `kani-attempt-v1` stay vendor-neutral. Supabase is an infrastructure implementation behind a versioned domain API; it is not a new content, question or evidence contract.

```text
Kani learner action
→ LocalAttemptStore (immediate, offline-safe)
→ separate sync queue metadata
→ authenticated /api/v1 Edge Function
→ household authorization
→ Postgres kani_attempts
→ remote history / revision / recommendations
```

The Study-Hub content plane is unaffected by this storage choice.

## Selected infrastructure

- Supabase Auth: adult/guardian account identity.
- Supabase Postgres: households, household membership, students and append-oriented attempt evidence.
- Supabase Edge Functions: only authenticated write/API boundary.
- Postgres Row Level Security: defense in depth for household-scoped reads.

Children do not need separate credentials initially. A guardian account owns/joins a household, and the household owns one or more Kani student profiles.

Existing local profile IDs such as `student_alex_1788670000000` remain stable text IDs and are imported non-destructively. They are unique within a household; display names are never authorization keys.

## Security rules

1. Never add an anonymous attempt-write endpoint.
2. Never commit a Supabase secret/service key or any provider secret.
3. Browser code must not write directly to learner-data tables. The authenticated role is read-only at the table privilege layer; Edge Functions validate writes and use server-only credentials.
4. Every protected API request validates the user JWT and derives household membership server-side.
5. Production CORS uses an exact Kani-origin allowlist; wildcard authenticated CORS is not acceptable.
6. Row Level Security must stay enabled on household, member, student and attempt tables.
7. Attempt events are immutable. Repeated identical `attemptId` uploads are idempotent; conflicting payloads return `409` rather than overwrite history.
8. Remote outages must never block Learn, Practice, Play, Brain or Challenges. Local storage remains the first write.
9. Mutating API requests are bounded by body size, batch size and a server-side write quota.
10. The browser must never possess `service_role` or another privileged Supabase secret.
11. Revision/recommendation responses must remain deterministic and explainable from canonical evidence; do not introduce an opaque remote mastery score.

## Repository layout

```text
supabase/
  config.toml
  migrations/
    20260906070000_kani_learner_evidence.sql
    20260906071500_kani_api_write_quota.sql
  functions/
    deno.json
    _shared/kaniApiProtocol.ts
    kani-api/index.ts
  tests/database/
    kani_learner_rls.test.sql

src/integration/kani/
  evidenceDerivations.ts
  AttemptSyncQueue.ts
  AttemptSyncCoordinator.ts
  LearnerApiClient.ts
  GuardianSessionProvider.ts
  LocalFirstAttemptStore.ts
  RemoteAwareAttemptStore.ts
  StudentProfileSync.ts
  mergeAttemptHistory.ts
```

The database test is intended for the Supabase CLI / pgTAP test runner. Normal GitHub CI also runs `npm run audit:backend`, a dependency-free safety audit for critical RLS, privilege, quota, authenticated-function and deterministic-evidence invariants. CI additionally runs `deno check` against the Edge Function so the server handler is type-checked independently of the Vite frontend.

## Local database workflow

Prerequisites for full database tests: Docker plus the Supabase CLI installed by the developer/CI environment. No hosted project credentials are required for the local test database.

```bash
supabase start
supabase db reset
supabase test db
```

`supabase db reset` reapplies migrations to the local database. `supabase test db` executes pgTAP files under `supabase/tests/database`.

The repository does not require the Supabase CLI for the existing frontend build pipeline; the static backend audit and Deno type-check protect the checked-in server code there.

## Environment model

### Local frontend

Auth/sync client code is fail-closed and may consume public browser configuration such as:

```text
VITE_KANI_SYNC_ENABLED=false
VITE_KANI_API_BASE_URL=<local-or-hosted-function-domain>/functions/v1/kani-api/api/v1
VITE_SUPABASE_URL=<local-or-hosted-project-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<public browser key>
VITE_KANI_HOUSEHOLD_ID=<optional explicit household selector>
```

A publishable browser key is not a privileged database credential. Do not place secret/service-role keys in `VITE_*` variables because Vite embeds those values into the browser bundle.

### Edge Function / hosted backend

The current function uses `@supabase/server` with `auth: 'user'`. Supabase platform JWT verification stays enabled for `kani-api`, and the request context provides the authenticated claims plus a server-only admin client.

Required function configuration includes:

```text
KANI_ALLOWED_ORIGINS=https://reallaksh19.github.io
```

Use a comma-separated list only when additional explicit origins are required. `*` is rejected by the protocol. Local Supabase development falls back to the Vite localhost origins only when `SUPABASE_URL` itself is local.

Server-side credentials belong only in Supabase-managed function configuration. The API accepts `x-kani-household-id` only as a selector when an account belongs to multiple households; membership is always revalidated server-side.

### CI / staging / production

Frontend CI remains green with sync disabled and without hosted Supabase secrets. Authenticated staging smoke tests should be added only after a real staging project, test guardian identity and CI secrets are configured. Production sync remains feature-gated until those tests pass.

## Database model

The first migration creates:

```text
kani_households
kani_household_members
kani_students
kani_attempts
```

`kani_attempts.payload` stores the validated versioned `kani-attempt-v1` object. Indexed projection columns (`completed_at`, `activity_id`, `topic_id`, `question_id`, `skill_ids`, etc.) support efficient queries without changing the canonical contract. CHECK constraints bind core payload identity fields to their indexed columns.

Attempts are append-oriented. A trigger rejects UPDATE operations; explicit authenticated account/student deletion may later cascade-delete history only through a dedicated account-deletion workflow.

The second migration adds a private per-user/per-minute write-quota table and a service-role-only security-definer RPC. It is abuse protection, not billing or learner progress state.

## Versioned Edge Function API

Implemented routes:

```text
GET  /api/v1/students
POST /api/v1/students
POST /api/v1/attempts
GET  /api/v1/students/:studentId/history
GET  /api/v1/students/:studentId/revision
GET  /api/v1/students/:studentId/recommendations
```

The deployed Supabase function prefix wraps these domain routes, for example:

```text
/functions/v1/kani-api/api/v1/students
```

### Students

`POST /students` imports or creates an existing Kani student profile without changing its stable `studentId`. Replaying identical profile data is idempotent. Reusing the same ID with different profile data returns `409`.

### Attempts

`POST /attempts` accepts `{ "attempts": [...] }` with at most 50 canonical attempts and a maximum request body of 256 KiB. Every attempt is revalidated against the server-side `kani-attempt-v1` rules before persistence.

Identical `attemptId` replays are accepted. A differing payload for an existing ID returns `409`. The API verifies every submitted student belongs to the selected authenticated household.

### History

History is newest-first and cursor-paginated. Default page size is 50 and the server caps it at 100. Cursors are opaque to clients and include the `(completedAt, attemptId)` ordering boundary.

### Revision / recommendations

These endpoints now reuse `src/integration/kani/evidenceDerivations.ts`, the same deterministic logic exported to local Kani revision/evidence utilities. This prevents a separate server-side notion of learner state.

The server loads a bounded newest-first evidence window of at most 1,000 canonical attempts for the authenticated household/student. Responses include:

- page revision signals;
- topic and skill evidence rollups;
- recent/previous credit evidence;
- trend and evidence-confidence labels;
- explicit recommendation `reasonCode` values;
- supporting attempt/scored counts; and
- `evidenceWindow.truncated` so clients know when the bounded service window was reached.

There is intentionally no `/mastery` endpoint and no opaque recommendation model. The service produces explainable evidence/revision signals from the same canonical attempt records used locally.

## Local-first sync semantics

The client foundation now implements these rules:

1. write every attempt to `LocalAttemptStore` immediately;
2. track upload state separately from the canonical attempt payload;
3. queue uploads only when sync configuration is explicitly ready;
4. retry transient failures with exponential backoff, jitter and `Retry-After` support;
5. keep local attempts after successful upload;
6. merge local + remote reads by immutable `attemptId`;
7. surface conflicting same-ID payloads instead of silently overwriting evidence;
8. preserve stable `studentId` across devices;
9. import/link student profiles by stable ID, never display name; and
10. fall back to local history when auth/network/remote reads fail.

## Production rollout gate

Merging the API/client code does **not** enable remote learner storage in production. Before enabling sync, the platform still requires:

- a configured Supabase staging project;
- migrations applied and pgTAP authorization tests executed against that environment;
- `kani-api` deployed with exact allowed-origin configuration;
- guardian auth/profile-link UX backed by real Supabase Auth;
- authenticated staging tests for cross-household denial, replay behavior, history pagination and evidence-service parity;
- offline/reconnect and second-device tests;
- production project/configuration; and
- a production sync smoke test.
