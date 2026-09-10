# E4 — Production-grade identity + authorization

Parent roadmap: `reallaksh19/Study-Hub#32`; implementation gate: `reallaksh19/Study-Hub#37`.

## Security boundary

E4 keeps authentication and authorization separate:

```text
Bearer JWT
→ OidcRequestIdentityProvider verifies signature + registered claims
→ verified subject (`sub`) becomes guardian userId
→ KaniApiApp resolves Kani household membership
→ requested household/student authorization is checked server-side
→ application operation executes
```

A client `x-kani-household-id` is only a selector. It is never authorization proof.

## Provider-neutral OIDC verifier

`src/infrastructure/identity/oidc/OidcRequestIdentityProvider.ts` implements the existing provider-neutral `RequestIdentityProvider` port. It has no Supabase, Neon, Firebase or database dependency.

Accepted token profile:
- compact signed JWT with exactly three segments;
- `alg=RS256` only;
- non-empty `kid`;
- optional `typ` limited to `JWT` or `at+jwt`;
- RSA JWKS key whose `alg`, `use` and `key_ops` cannot contradict signature verification;
- exact configured issuer;
- configured Kani API audience present in `aud`;
- non-empty stable subject in `sub`;
- required numeric `exp`;
- optional numeric `nbf` / `iat` checked with bounded clock skew.

The verifier rejects algorithm confusion, bad signatures, wrong issuer/audience, expired/not-yet-valid tokens, future `iat`, unknown keys, duplicate `kid` entries, malformed JWKS, insecure remote HTTP endpoints and provider outages with explicit typed errors.

Remote issuer/JWKS endpoints must use HTTPS. Loopback HTTP is accepted only so deterministic local/CI certification can run without an external identity vendor.

## JWKS behavior

JWKS loading is bounded:
- response body ≤ 512 KiB;
- 1–100 keys;
- duplicate keyed entries fail closed;
- redirects are rejected;
- `Cache-Control: max-age` is honored with a one-hour cap;
- default cache lifetime is five minutes;
- a missing `kid` triggers exactly one forced refresh to support normal key rotation;
- a still-missing key is an authentication failure, not an authorization bypass.

## Connector-free authenticated acceptance

`.github/workflows/connector-free-staging-auth.yml` runs on a GitHub-hosted Node 22 runner with no database connector, provider account or secret.

The acceptance test starts two real HTTP listeners inside the hosted runner:
1. an OIDC/JWKS issuer fixture using a runtime-generated RSA signing key;
2. the connector-free Kani HTTP API using `SQLiteStore` and the production OIDC verifier.

It creates two isolated guardian/household fixtures plus an unlinked and a multi-household guardian, then proves over the HTTP boundary:
- unauthenticated learner requests are denied;
- allowed Origin receives exact CORS; a different Origin is denied;
- Guardian A can read only Household A;
- Guardian B can read only Household B;
- cross-household selectors are denied;
- unlinked guardians are denied;
- multi-household guardians must select an authorized household;
- a correctly signed token with the wrong issuer is denied;
- stable student replay is idempotent and conflicting profile data returns 409;
- attempt replay is idempotent and conflicting immutable evidence returns 409;
- cursor history is deterministic for identical timestamps;
- revision/recommendations derive from canonical attempts without an opaque mastery percentage;
- knowing another household's stable student id does not grant access.

The lower-level OIDC suite separately covers wrong audience, signature, algorithm, token times, key rotation/cache behavior, malformed JWKS and provider availability failures.

## Browser/database boundary

The browser still communicates only with the Kani HTTP API. SQLite stays under `src/infrastructure/storage/sqlite`; OIDC request verification stays under server infrastructure. Architecture lint rejects direct product UI references to SQLite, Node HTTP server or the server OIDC verifier and continues scanning browser-facing source for admin/service/database secret patterns.

## Production state

E4 does **not** enable authenticated production sync or route production traffic to SQLite.

```text
Learn: ON
Practice: OFF pending Study-Hub#13
Authenticated production sync: OFF
```

The existing Supabase implementation remains a reference adapter and must continue passing its audit/typecheck/pgTAP regression gates.

## Persistent external staging

The GitHub-hosted acceptance workflow is deterministic connector-free certification of the real HTTP + JWT + SQLite stack. A persistent external single-node SQLite deployment with durable disk is the final infrastructure activation evidence for Study-Hub#37 before E4 is treated as externally staged. Do not fake this on an ephemeral serverless filesystem.
