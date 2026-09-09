# Kani upstream contract lock

Kani consumes canonical platform contracts from Study-Hub. It must never follow Study-Hub `main` implicitly.

## Locked authority

`integration/upstream.lock.json` records:

- canonical source repository: `reallaksh19/Study-Hub`;
- an immutable 40-character Study-Hub commit SHA;
- the Study-Hub platform manifest version;
- the exact path and SHA-256 of each canonical v1 schema.

The files under `integration/contracts/` are vendored snapshots of the exact bytes at that locked commit. They are **not independently editable Kani schemas**.

## Verification

Local vendored integrity:

```bash
npm run audit:contracts
```

Cross-repository verification:

```bash
KANI_CONTRACT_SOURCE_DIR=/path/to/study-hub-at-locked-sha npm run audit:contracts
```

CI performs the stronger form automatically: it reads the lock, checks out Study-Hub at exactly that commit, verifies the upstream manifest and hashes, and compares every vendored schema byte-for-byte.

## Updating the lock

A contract update must be deliberate and atomic:

1. Land and validate the contract change in Study-Hub first.
2. Record the immutable merged Study-Hub commit SHA.
3. Copy the exact canonical schema bytes into Kani.
4. Update `integration/upstream.lock.json` with the exact upstream SHA/hashes in the same PR.
5. Run `npm run audit:contracts` against that exact Study-Hub checkout.
6. Run the full Kani CI suite.
7. For breaking semantics, use a new contract major. Do not silently reinterpret v1.

Do not regenerate stable learner IDs or evidence IDs during contract updates.

## Architecture anti-drift

`npm run audit:architecture` blocks browser admin-secret leakage and prevents provider-specific imports from entering the provider-neutral `src/domain`, `src/application`, and `src/ports` layers as those layers are introduced by later roadmap batches.

The current Supabase implementation under explicit integration/server boundaries is grandfathered for E1 only. Later connector-free backend batches will move infrastructure behind ports without changing Kani's public contracts.

## Worksheet gate

The authoritative Worksheet repository remains unresolved under Study-Hub #13. Do not guess a repository or create a Worksheet contract lock until #13 records the real source repository. Practice remains disabled until that source passes the canonical export and compatibility gates.
