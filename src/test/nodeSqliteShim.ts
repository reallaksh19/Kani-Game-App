import { createRequire } from 'node:module';

// Vitest 1 / Vite 5 predates the node:sqlite builtin and incorrectly resolves
// the specifier as a package named `sqlite`. Tests alias node:sqlite here and
// deliberately defer loading to Node itself. Production/backend source keeps the
// native node:sqlite import and therefore does not depend on this test shim.
const nodeRequire = createRequire(import.meta.url);
const sqliteSpecifier = ['node', 'sqlite'].join(':');
const sqlite = nodeRequire(sqliteSpecifier) as typeof import('node:sqlite');

export const DatabaseSync = sqlite.DatabaseSync;
