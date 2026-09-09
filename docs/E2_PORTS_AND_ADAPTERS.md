# E2 — Kani ports, adapters and configuration boundaries

Parent roadmap: `reallaksh19/Study-Hub#32`; implementation gate: `reallaksh19/Study-Hub#35`.

## Permanent dependency direction

```text
product/domain/application
        ↓
      ports
        ↑
infrastructure adapters
```

Provider selection belongs only in infrastructure composition roots. Product UI may call a neutral composition factory but must not import or construct Supabase/Neon/Firebase/provider implementations.

## Identity

Provider-neutral contract: `src/ports/identity.ts`.

Current infrastructure adapter:

```text
src/infrastructure/identity/supabase/SupabaseGuardianIdentityProvider.ts
```

Composition root:

```text
src/infrastructure/identity/createGuardianIdentityProvider.ts
```

`src/integration/kani/SupabaseGuardianAuth.ts` is a migration compatibility export only. New product code must not import it.

Authentication establishes guardian identity only. Household authorization remains server-authoritative and is not delegated to an identity provider.

## Storage

Provider-neutral contract: `src/ports/storage.ts`.

E2 adapters:

- `src/infrastructure/storage/memory/MemoryStore.ts` — deterministic tests/conformance; never production persistence.
- `src/infrastructure/storage/local/LocalAttemptStore.ts` — current local-first browser attempt persistence.

`src/integration/kani/AttemptStore.ts` is a migration compatibility export only.

Future SQLite/Postgres implementations must implement the same port semantics and pass the shared conformance suite before use.

## Immutable evidence semantics

For `attemptId`:

```text
new id                         → insert
same id + same canonical hash → idempotent success
same id + different hash      → conflict; never overwrite
```

Canonical JSON and SHA-256 live under `src/domain/`; they have no provider dependencies.

## Typed runtime configuration

`src/config/kaniRuntimeConfig.ts` is the security-aware configuration boundary.

Current selectors:

```text
VITE_KANI_ENV=development|test|staging|production
VITE_KANI_STORAGE_DRIVER=local|memory
VITE_KANI_AUTH_DRIVER=supabase
```

Rules:

- sync remains explicitly enabled by `VITE_KANI_SYNC_ENABLED`;
- staging/production HTTP endpoints must use HTTPS;
- URLs with embedded credentials are rejected;
- unsupported drivers are rejected;
- MemoryStore is rejected in staging/production;
- `sb_secret_` cannot occupy a browser publishable-key slot;
- public `VITE_*` admin/service-role/database/private-key variables are rejected;
- missing API/identity configuration fails closed when sync is requested.

The legacy `learnerSyncConfig` shape is preserved as a compatibility facade, but product UI consumes its provider-neutral `identity: { driver, endpoint, publicKey }` field.

## Conformance

`src/infrastructure/storage/attemptRepositoryConformance.test.ts` runs the same behavioral cases against MemoryStore and LocalAttemptStore:

- stable `studentId` isolation;
- identical replay idempotency;
- conflicting immutable `attemptId` rejection;
- deterministic ordering/filtering;
- malformed canonical payload rejection.

MemoryStore additionally checks duplicate display-name independence and household-scoped membership.

Any future storage adapter must be added to the same conformance matrix before it can be selected by configuration.

## Anti-drift

`scripts/audit-architecture.mjs` fails CI when:

- domain/application/ports import provider SDK/modules;
- product components import or construct provider-specific identity adapters;
- provider implementation logic returns to the legacy Supabase compatibility shim;
- browser source contains prohibited secret/admin/database credential patterns;
- required E2 port/adapter boundaries disappear.

## E2 non-goals

E2 does not:

- enable production authenticated sync;
- change Learn/Practice production rollout flags;
- replace or delete the existing Supabase backend reference implementation;
- add SQLite/Postgres production storage;
- change canonical Kani contract versions;
- resolve the Worksheet repository gate.
