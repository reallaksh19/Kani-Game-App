import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = path.join(root, 'integration/upstream.lock.json');
const lock = JSON.parse(await readFile(lockPath, 'utf8'));
const requiredContracts = ['kani-content-v1', 'kani-catalog-v1', 'kani-activity-v1', 'kani-attempt-v1'];
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function fail(message) {
  throw new Error(`Contract lock audit failed: ${message}`);
}

if (lock.lockVersion !== '1.0') fail(`unsupported lockVersion ${lock.lockVersion}`);
if (lock.contractSource !== 'reallaksh19/Study-Hub') fail(`unexpected contractSource ${lock.contractSource}`);
if (!/^[0-9a-f]{40}$/.test(lock.sourceCommit ?? '')) fail('sourceCommit must be an immutable 40-character lowercase Git SHA');
if (lock.manifestVersion !== '1.0') fail(`unexpected manifestVersion ${lock.manifestVersion}`);

const actualKeys = Object.keys(lock.contracts ?? {}).sort();
if (JSON.stringify(actualKeys) !== JSON.stringify([...requiredContracts].sort())) {
  fail(`contract set drift: expected ${requiredContracts.join(', ')}, received ${actualKeys.join(', ')}`);
}

for (const id of requiredContracts) {
  const entry = lock.contracts[id];
  if (entry.schemaVersion !== '1.0') fail(`${id} schemaVersion drifted to ${entry.schemaVersion}`);
  if (!/^[0-9a-f]{64}$/.test(entry.sha256 ?? '')) fail(`${id} has an invalid SHA-256 lock`);
  const localPath = path.join(root, entry.path);
  const localBytes = await readFile(localPath);
  const localHash = sha256(localBytes);
  if (localHash !== entry.sha256) fail(`${id} local bytes hash ${localHash}, expected ${entry.sha256}`);
}

const sourceDir = process.env.KANI_CONTRACT_SOURCE_DIR?.trim();
if (sourceDir) {
  const sourceRoot = path.resolve(sourceDir);
  const checkedOutSha = execFileSync('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (checkedOutSha !== lock.sourceCommit) fail(`upstream checkout is ${checkedOutSha}, lock requires ${lock.sourceCommit}`);

  const manifest = JSON.parse(await readFile(path.join(sourceRoot, lock.sourceManifestPath), 'utf8'));
  if (manifest.manifestVersion !== lock.manifestVersion) fail(`upstream manifestVersion ${manifest.manifestVersion} does not match ${lock.manifestVersion}`);
  if (manifest.contractAuthority !== lock.contractSource) fail(`upstream authority ${manifest.contractAuthority} does not match ${lock.contractSource}`);

  for (const id of requiredContracts) {
    const locked = lock.contracts[id];
    const upstream = manifest.contracts?.[id];
    if (!upstream) fail(`upstream manifest is missing ${id}`);
    if (upstream.schemaVersion !== locked.schemaVersion) fail(`${id} upstream schemaVersion ${upstream.schemaVersion} != ${locked.schemaVersion}`);
    if (upstream.sha256 !== locked.sha256) fail(`${id} upstream hash ${upstream.sha256} != ${locked.sha256}`);
    if (upstream.schemaPath !== locked.path) fail(`${id} upstream path ${upstream.schemaPath} != ${locked.path}`);

    const localBytes = await readFile(path.join(root, locked.path));
    const upstreamBytes = await readFile(path.join(sourceRoot, upstream.schemaPath));
    if (!localBytes.equals(upstreamBytes)) fail(`${id} vendored bytes differ from Study-Hub@${lock.sourceCommit}`);
  }
}

console.log(sourceDir
  ? `Kani contract lock matches Study-Hub@${lock.sourceCommit}.`
  : `Kani vendored contract schemas match immutable lock ${lock.sourceCommit}.`);
