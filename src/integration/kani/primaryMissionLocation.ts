export interface PrimaryMissionLocationLike {
  pathname?: string;
  search?: string;
  hash?: string;
}

const TOKEN = '[A-Z0-9]{8}';
const PRIMARY_PATH_RE = new RegExp(`(?:^|/)primary/m/(${TOKEN})(?:/|$)`, 'i');

function normalizeToken(value: string | null | undefined): string | null {
  if (!value) return null;
  const token = value.trim().toUpperCase();
  return new RegExp(`^${TOKEN}$`).test(token) ? token : null;
}

export function parsePrimaryMissionOpaqueId(location: PrimaryMissionLocationLike): string | null {
  const hash = location.hash || '';
  const hashMatch = hash.replace(/^#/, '').match(PRIMARY_PATH_RE);
  const hashToken = normalizeToken(hashMatch?.[1]);
  if (hashToken) return hashToken;

  const pathMatch = (location.pathname || '').match(PRIMARY_PATH_RE);
  const pathToken = normalizeToken(pathMatch?.[1]);
  if (pathToken) return pathToken;

  const search = location.search || '';
  const query = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return normalizeToken(query.get('mission'));
}

export function buildPrimaryMissionHash(opaqueId: string): string {
  const token = normalizeToken(opaqueId);
  if (!token) throw new Error('Primary mission ID must be an 8-character opaque token');
  return `#/primary/m/${token}`;
}
