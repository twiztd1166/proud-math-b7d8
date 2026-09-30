#!/usr/bin/env bash
set -euo pipefail

site="${1:?site URL required}"
release_sha="${2:-manual}"
output="${3:-/tmp/index.html}"
attempts="${ASSET_CONVERGENCE_ATTEMPTS:-18}"
sleep_seconds="${ASSET_CONVERGENCE_SLEEP_SECONDS:-10}"

for attempt in $(seq 1 "$attempts"); do
  curl --retry 2 --retry-delay 2 --retry-all-errors -fsS     "$site/?release=$release_sha&attempt=$attempt"     -o "$output"
  if python3 scripts/verify-app-asset-contract.py --live-entry "$output" >/tmp/asset-contract.out 2>/tmp/asset-contract.err; then
    cat /tmp/asset-contract.out
    echo "Stable frontend converged on attempt $attempt."
    exit 0
  fi
  echo "Stable frontend has not converged to this repository asset version yet (attempt $attempt/$attempts)."
  if [ "$attempt" -lt "$attempts" ]; then
    sleep "$sleep_seconds"
  fi
done

echo "::error::Stable frontend did not converge to the repository asset version within the bounded window."
cat /tmp/asset-contract.err >&2 || true
exit 1
