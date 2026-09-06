#!/usr/bin/env bash
set -euo pipefail

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 127
  fi
}

require_command docker
require_command supabase

echo "Kani local Supabase verification"
echo "  Docker:   $(docker --version)"
echo "  Supabase: $(supabase --version)"

echo "\n[1/3] Starting local Supabase services..."
supabase start

echo "\n[2/3] Reapplying migrations from a clean local database..."
supabase db reset

echo "\n[3/3] Running pgTAP database/RLS tests..."
supabase test db

echo "\nLocal Supabase verification passed."

if [[ "${KANI_STOP_SUPABASE_AFTER_VERIFY:-0}" == "1" ]]; then
  echo "Stopping local Supabase services because KANI_STOP_SUPABASE_AFTER_VERIFY=1"
  supabase stop
else
  echo "Local Supabase services are still running for inspection. Run 'supabase stop' when finished."
fi
