# Kani learner sync — Stage 6 staging verification runbook

Status: **verification harness ready; real staging infrastructure still required**.

This runbook is the execution companion to Study-Hub issues #18, #20 and #21. It does not change the permanent three-app boundary and it does not enable production learner sync.

## 1. Local Linux/macOS database verification

This is the one validation step that needs Docker + the Supabase CLI on a local/Linux-capable machine. It requires no hosted credentials.

Prerequisites:

```bash
docker --version
supabase --version
```

From the repository root:

```bash
npm run verify:supabase-local
```

That command performs:

```text
supabase start
→ supabase db reset
→ supabase test db
```

It verifies that the checked-in migrations apply cleanly and executes the pgTAP RLS/authorization tests under `supabase/tests/database`.

The local services remain running after a successful verification for inspection. Stop them with:

```bash
supabase stop
```

or ask the helper to stop automatically:

```bash
KANI_STOP_SUPABASE_AFTER_VERIFY=1 npm run verify:supabase-local
```

### What to report if it fails

Do not send passwords, access tokens or service-role keys. The useful diagnostic output is:

```text
docker --version
supabase --version
npm run verify:supabase-local
```

plus the failing migration/test name and its error text.

## 2. Create the hosted staging project

Use a dedicated **staging** Supabase project. Do not use production learner data for the first authenticated acceptance run.

After creating the project:

1. link this repository's Supabase configuration to the staging project;
2. apply the checked-in migrations in order;
3. deploy `supabase/functions/kani-api`;
4. configure `KANI_ALLOWED_ORIGINS` to the exact staging Kani frontend origin;
5. create two guardian test accounts in separate households;
6. ensure each guardian is a member of only the intended test household for the cross-household denial proof.

The browser/runtime may use only the public Supabase URL + publishable key. The service-role key must never be added to `VITE_*`, repository variables, issue comments or client code.

## 3. Required GitHub staging configuration

The manual workflow `.github/workflows/staging-learner-sync-smoke.yml` intentionally separates public-ish configuration from credentials.

### Repository variables

```text
KANI_STAGING_SUPABASE_URL
KANI_STAGING_API_BASE_URL
KANI_STAGING_ALLOWED_ORIGIN
KANI_STAGING_HOUSEHOLD_A_ID
KANI_STAGING_HOUSEHOLD_B_ID
```

Example API base format:

```text
https://<project-ref>.supabase.co/functions/v1/kani-api/api/v1
```

### Repository secrets

```text
KANI_STAGING_PUBLISHABLE_KEY
KANI_STAGING_GUARDIAN_A_EMAIL
KANI_STAGING_GUARDIAN_A_PASSWORD
KANI_STAGING_GUARDIAN_B_EMAIL
KANI_STAGING_GUARDIAN_B_PASSWORD
```

The publishable key is not privileged, but storing it as a secret keeps the workflow configuration simple. **Do not add a service-role key.** The acceptance client should behave like a real guardian browser client.

## 4. Run the authenticated staging smoke

In GitHub Actions, run **Staging learner sync smoke** manually and enter:

```text
STAGING
```

for the acknowledgement input.

The smoke then verifies:

- Guardian A and B can authenticate through Supabase Auth.
- Anonymous learner reads/writes are denied.
- Allowed browser origin gets the exact CORS response.
- A disallowed origin is rejected.
- Guardian A cannot select Guardian B's household.
- Existing Kani-style stable student IDs are preserved.
- Two students can have the same display name while remaining separate identities.
- Identical student import replay is idempotent.
- Conflicting metadata for the same stable student ID returns `409`.
- Canonical attempts upload successfully.
- Identical `attemptId` replay is idempotent.
- A changed payload using an existing immutable `attemptId` returns `409`.
- Cursor pagination returns the staged attempts without duplication/loss.
- Guardian B cannot read Guardian A's student history.
- `/revision` and `/recommendations` are deterministic for unchanged evidence.
- Revision/recommendation responses expose bounded evidence metadata and no opaque `mastery` field.

The script creates disposable staging-only students/attempts prefixed with the GitHub run ID. It does not delete them because the public learner API intentionally has no destructive endpoint.

## 5. Frontend staging activation after backend smoke passes

Only after the hosted smoke is green should a staging Kani build use:

```text
VITE_KANI_SYNC_ENABLED=true
VITE_KANI_API_BASE_URL=<staging API base>
VITE_SUPABASE_URL=<staging Supabase URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<public publishable key>
VITE_KANI_HOUSEHOLD_ID=<optional selector for a multi-household guardian>
```

Then perform the browser/device proof:

1. sign in as the guardian;
2. explicitly link/import local stable student profiles;
3. complete learner work online;
4. complete learner work while offline;
5. reconnect and confirm the outbox flushes while local evidence remains;
6. sign in on a second device/browser profile;
7. explicitly import the remote-only student profile;
8. confirm remote history/revision is visible for the same stable `studentId`;
9. confirm a different household cannot see it.

## 6. Production gate

Production sync stays OFF until all of the following are true:

- local migration + pgTAP verification passes;
- hosted staging API smoke passes;
- browser offline/reconnect proof passes;
- second-device recovery proof passes;
- cross-household denial is confirmed;
- exact production CORS origin is configured;
- production secrets/config are provisioned through the appropriate secret store;
- a production-specific sync smoke exists and passes.

Do not replace any of these gates with a mock backend or anonymous write path.
