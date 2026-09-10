# E3 — Connector-free SQLite staging backend

Parent roadmap: `reallaksh19/Study-Hub#32`; implementation gate: `reallaksh19/Study-Hub#36`.

## Purpose

E3 proves the Kani learner API can run and be certified with **no database connector and no provider database SDK**. SQLite is an infrastructure adapter behind the E2 ports; `/api/v1` remains the stable application contract.

Production frontend rollout is intentionally unchanged in E3:

```text
Learn: ON
Practice: OFF
Authenticated production sync: OFF
```

The existing Supabase deployment remains a reference adapter only; E3 does not cut production traffic over to SQLite.

## Runtime requirement

SQLite uses Node's built-in `node:sqlite`, so backend development and CI require Node 22 or newer. No SQLite npm package, database connector, service-role key, or managed database account is required.

## Dependency direction

```text
src/application/api/KaniApiApp.ts
            ↓
     src/ports/backend.ts
            ↑
src/infrastructure/storage/sqlite/SQLiteStore.ts
```

Canonical API parsing/routing is owned by:

```text
src/application/api/kaniApiProtocol.ts
```

The historical Supabase helper path is now only a compatibility export, so the SQLite backend and Supabase reference function consume the same protocol implementation.

Provider-neutral evidence derivation and Kani runtime contract types live under `src/domain/`; historical `src/integration/kani/*` imports are compatibility exports.

## SQLite schema and migrations

Migrations are append-only and deterministic:

```text
src/infrastructure/storage/sqlite/migrations.ts
src/infrastructure/storage/sqlite/runMigrations.ts
```

The runner:
- creates `kani_schema_migrations`;
- hashes each migration SQL body with SHA-256;
- refuses a previously-applied migration whose name/checksum changes;
- runs each migration inside `BEGIN IMMEDIATE` / `COMMIT`;
- verifies the final schema version.

Current schema version: `2`.

Core tables:
- `kani_households`
- `kani_household_members`
- `kani_students`
- `kani_attempts`
- `kani_api_write_quota`
- `kani_schema_migrations`

`student_id` and `attempt_id` are stable keys. Duplicate display names are valid.

## Attempt immutability

Attempt conflict semantics are canonical-hash based:

```text
new attemptId + valid student       → insert
same attemptId + same payload hash  → idempotent replay
same attemptId + changed payload    → conflict; no overwrite
```

SQLite also enforces immutability below the application layer with `BEFORE UPDATE` and `BEFORE DELETE` triggers on `kani_attempts`.

## Authorization boundary

The application flow is unchanged:

```text
request token
→ RequestIdentityProvider verifies identity
→ Kani resolves household memberships
→ selected household/student is checked
→ application operation executes
```

A client household header is only a selector; membership is checked server-side.

E3 supplies `TestRequestIdentityProvider` only for CI. Its constructor accepts only the literal `test` environment. It is prohibited from product/application source by architecture lint. E4 is responsible for production-grade identity.

## Stable API resources

E3 implements the existing routes through `KaniApiApp`:

```text
GET  /api/v1/students
POST /api/v1/students
POST /api/v1/attempts
GET  /api/v1/students/:studentId/history
GET  /api/v1/students/:studentId/revision
GET  /api/v1/students/:studentId/recommendations
GET  /health/live
GET  /health/ready
GET  /health/version
```

History order is deterministic:

```text
completedAt DESC, attemptId DESC
```

Cursor pagination uses the same encoded `{completedAt, attemptId}` protocol as the reference API, with explicit malformed-cursor rejection.

## Limits

Application limits remain bounded:
- request body: 256 KiB;
- attempt upload batch: 50;
- history page: max 100;
- evidence window: 1000 attempts;
- write quota: default 120 units/minute per authenticated user.

Quota state is SQLite-backed, not browser state. A denied write returns HTTP 429 with `Retry-After` and never modifies learner evidence.

## CORS

Authenticated browser CORS is exact-origin only. `*` is invalid configuration. Server-to-server requests without an Origin header remain valid.

## Backup and recovery

`SQLiteStore.backupTo(path)` uses SQLite `VACUUM INTO` to create a standalone consistent database file. Certification tests open the backup as a fresh `SQLiteStore` and verify memberships and canonical attempts survive intact.

Operational recovery rule:
1. stop writes;
2. create/copy a certified SQLite backup;
3. open the backup with the current application;
4. migration checksum/version verification must pass;
5. run health + API smoke before routing traffic.

Never edit an applied migration in place; add a new migration.

## CI certification

`npm run test:sqlite-backend` runs:
- SQLite migration/reopen tests;
- database-level attempt immutability tests;
- backup/restore test;
- shared attempt repository conformance including SQLiteStore;
- full HTTP API matrix over SQLite;
- household isolation;
- stable-ID idempotency/conflict checks;
- cursor pagination edge cases;
- CORS/body/batch/quota negatives;
- health/version;
- revision/recommendation evidence semantics.

The normal full Vitest suite runs afterward, followed by production frontend build. The existing Deno/Supabase reference function is still type-checked against the same provider-neutral protocol.

## Anti-drift

CI fails if:
- `node:sqlite` or another storage implementation is imported into domain/application/ports;
- product UI imports database implementations;
- test identity leaks outside its CI adapter/tests;
- canonical API protocol implementation moves back under the Supabase provider directory;
- required SQLite migration/store/API boundaries disappear.

## E3 non-goals

E3 does not:
- provide production OIDC/JWT identity (E4);
- enable authenticated production sync;
- switch production from the current reference backend;
- introduce Postgres;
- change canonical contract versions;
- enable Practice or guess the Worksheet repository.
