#!/usr/bin/env bash
set -euo pipefail

SUPABASE_CLI_VERSION="${KANI_SUPABASE_CLI_VERSION:-2.116.0}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 127
  fi
}

require_command docker

if command -v supabase >/dev/null 2>&1; then
  SUPABASE_CMD=(supabase)
  SUPABASE_SOURCE="global"
else
  require_command node
  require_command npx
  NODE_MAJOR="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
  if [[ -z "$NODE_MAJOR" || "$NODE_MAJOR" -lt 20 ]]; then
    echo "Supabase CLI via npm/npx requires Node.js 20 or newer; found $(node --version)." >&2
    exit 127
  fi
  SUPABASE_CMD=(npx --yes "supabase@${SUPABASE_CLI_VERSION}")
  SUPABASE_SOURCE="pinned npx fallback"
fi

run_supabase() {
  "${SUPABASE_CMD[@]}" "$@"
}

echo "Kani local Supabase verification"
echo "  Docker:   $(docker --version)"
echo "  Supabase: $(run_supabase --version) (${SUPABASE_SOURCE})"

printf '\n[1/3] Starting local Supabase services...\n'
run_supabase start

printf '\n[2/3] Reapplying migrations from a clean local database...\n'
run_supabase db reset

printf '\n[3/3] Running pgTAP database/RLS tests...\n'
run_supabase test db

printf '\nLocal Supabase verification passed.\n'

if [[ "${KANI_STOP_SUPABASE_AFTER_VERIFY:-0}" == "1" ]]; then
  echo "Stopping local Supabase services because KANI_STOP_SUPABASE_AFTER_VERIFY=1"
  run_supabase stop
else
  echo "Local Supabase services are still running for inspection."
  if [[ "$SUPABASE_SOURCE" == "global" ]]; then
    echo "Run 'supabase stop' when finished."
  else
    echo "Run 'npx --yes supabase@${SUPABASE_CLI_VERSION} stop' when finished."
  fi
fi
