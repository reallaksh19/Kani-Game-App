# Authenticated Kani learner sync

Status: **backend foundation in progress**. Architecture decision: Study-Hub #15. Implementation epic: Study-Hub #18.

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
7. Attempt events are immutable. Repeated identical `attemptId` uploads are idempotent; conflicting payloads must return `409` rather than overwrite history.
8. Remote outages must never block Learn, Practice, Play, Brain or Challenges. Local storage remains the first write.

## Repository layout

```text
supabase/
  config.toml
  migrations/
    20260906070000_kani_learner_evidence.sql
  tests/database/
    kani_learner_rls.test.sql
```

The database test is intended for the Supabase CLI / pgTAP test runner. Normal GitHub CI also runs `npm run audit:backend`, a static safety audit that catches accidental removal of critical RLS/privilege/immutability invariants even when Docker/Supabase CLI is unavailable.

## Local database workflow

Prerequisites for full database tests: Docker plus the Supabase CLI installed by the developer/CI environment. No hosted project credentials are required for the local test database.

```bash
supabase start
supabase db reset
supabase test db
```

`supabase db reset` reapplies migrations to the local database. `supabase test db` executes pgTAP files under `supabase/tests/database`.

The repository does not require the Supabase CLI for the existing frontend CI/build pipeline; the static backend audit protects the checked-in SQL there.

## Environment model

### Local frontend

Future auth/sync client code may consume public browser configuration such as:

```text
VITE_KANI_SYNC_ENABLED=false
VITE_SUPABASE_URL=<local-or-hosted-project-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<public browser key>
```

A publishable browser key is not a privileged database credential. Do not place secret/service-role keys in `VITE_*` variables because Vite embeds those values into the browser bundle.

### Edge Function / hosted backend

Server-side credentials and other sensitive configuration belong only in the Supabase project/function secret store. The Edge Function must not accept a client-supplied household ID as authorization proof.

### CI / staging / production

Frontend CI must remain green with sync disabled and without Supabase secrets. Authenticated staging smoke tests should be added only after a real staging project, test guardian identity and CI secrets are configured. Production sync must remain feature-gated until those tests pass.

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

## Planned API

The next implementation stage is a versioned Edge Function router:

```text
GET  /api/v1/students
POST /api/v1/students
POST /api/v1/attempts
GET  /api/v1/students/:studentId/history
GET  /api/v1/students/:studentId/revision
GET  /api/v1/students/:studentId/recommendations
```

`POST /attempts` will support bounded batches for offline replay. History will use cursor pagination. Revision and recommendation responses will reuse the deterministic evidence derivations already implemented in Kani; no remote mastery percentage is introduced.

## Local-first sync semantics

When the client sync stage is implemented:

1. write every attempt to `LocalAttemptStore` immediately;
2. track upload state separately from the canonical attempt payload;
3. upload pending attempts in bounded batches after authenticated profile linking;
4. retry transient failures with exponential backoff and jitter;
5. keep local attempts after successful upload;
6. merge local + remote reads by `attemptId`;
7. preserve stable `studentId` across devices;
8. surface sync state without blocking learning when the backend is unavailable.

## Production rollout gate

A schema merge does **not** enable remote learner storage in production. Before enabling sync, the project still requires:

- a configured Supabase staging/production project;
- reviewed migrations and RLS policies;
- deployed authenticated Edge Function API;
- guardian auth/profile-link UX;
- idempotent local-first queue;
- cross-household authorization tests;
- offline/reconnect and second-device tests;
- staging authenticated smoke; and
- production secrets/configuration plus a production sync smoke.
