# kani-api Edge Function

Authenticated learner-data API for Kani. This function is infrastructure behind the vendor-neutral `kani-attempt-v1` contract.

## Auth

- `verify_jwt = true` in `supabase/config.toml`.
- Handler uses `@supabase/server` with `auth: 'user'`.
- Household access is revalidated server-side for every request.
- Browser table writes remain revoked; writes use the server-only admin client after domain validation.

## Routes

The Supabase function prefix wraps the stable domain routes:

```text
/functions/v1/kani-api/api/v1/students
/functions/v1/kani-api/api/v1/attempts
/functions/v1/kani-api/api/v1/students/:studentId/history
/functions/v1/kani-api/api/v1/students/:studentId/revision
/functions/v1/kani-api/api/v1/students/:studentId/recommendations
```

Revision and recommendation routes are intentionally reserved but return `501 NOT_ENABLED_YET` until the remote derivation stage is implemented.

## Required configuration

Production must configure an exact allowlist, for example:

```text
KANI_ALLOWED_ORIGINS=https://reallaksh19.github.io
```

Never use `*` for authenticated browser requests.

## Validation and limits

- request body: max 256 KiB
- attempt batch: max 50
- history page: max 100
- mutations consume a service-side per-user write quota
- duplicate identical `attemptId`: idempotent success
- duplicate conflicting `attemptId`: HTTP 409

## Verification

Normal CI runs:

```text
npm run audit:backend
deno check --config supabase/functions/deno.json supabase/functions/kani-api/index.ts
npm test
```

Hosted deployment remains disabled until a real Supabase project, staging auth fixtures and CI secrets are configured.
