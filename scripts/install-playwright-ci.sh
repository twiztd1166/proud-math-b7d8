#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <playwright-root> <browser> [browser ...]" >&2
  exit 64
fi

PLAYWRIGHT_ROOT="$1"
shift
BROWSERS=("$@")
PW_DEPS_LOG="${RUNNER_TEMP:-/tmp}/pcm-playwright-deps-dry-run.log"
APT_NETWORK_CONF='/etc/apt/apt.conf.d/99paradise-ci-network'

rm -rf "$PLAYWRIGHT_ROOT" node_modules
mkdir -p "$PLAYWRIGHT_ROOT"
printf '{"private":true,"type":"module"}\n' > "$PLAYWRIGHT_ROOT/package.json"
npm install --prefix "$PLAYWRIGHT_ROOT" --no-save --ignore-scripts --package-lock=false @playwright/test
ln -s "$PLAYWRIGHT_ROOT/node_modules" node_modules
PW='./node_modules/.bin/playwright'
"$PW" --version

# Playwright documents install-deps --dry-run as a non-mutating Linux check that exits
# non-zero when required OS packages are missing. Avoid apt entirely when the hosted
# runner already satisfies the browser dependency set.
if "$PW" install-deps --dry-run "${BROWSERS[@]}" >"$PW_DEPS_LOG" 2>&1; then
  echo 'Playwright OS dependency dry-run PASS; installing browser binaries without apt.'
  "$PW" install "${BROWSERS[@]}"
  exit 0
fi

cat "$PW_DEPS_LOG"
echo 'Playwright OS dependencies are missing; using bounded Ubuntu archive fallback.'

# GitHub-hosted Ubuntu runners use a mirror list that can prefer azure.archive.ubuntu.com.
# A prior Paradise run stalled there for 27 minutes while archive.ubuntu.com remained
# reachable. Keep Playwright's normal --with-deps behavior, but make the Ubuntu source
# deterministic and bound apt network retries/timeouts so CI fails instead of hanging.
if [[ -f /etc/apt/apt-mirrors.txt ]]; then
  printf 'https://archive.ubuntu.com/ubuntu/\n' | sudo tee /etc/apt/apt-mirrors.txt >/dev/null
fi
for source in /etc/apt/sources.list /etc/apt/sources.list.d/ubuntu.sources; do
  if [[ -f "$source" ]]; then
    sudo sed -i \
      -e 's|http://azure.archive.ubuntu.com/ubuntu|https://archive.ubuntu.com/ubuntu|g' \
      -e 's|https://azure.archive.ubuntu.com/ubuntu|https://archive.ubuntu.com/ubuntu|g' \
      -e 's|http://archive.ubuntu.com/ubuntu|https://archive.ubuntu.com/ubuntu|g' \
      "$source"
  fi
done
sudo tee "$APT_NETWORK_CONF" >/dev/null <<'EOF'
Acquire::Retries "3";
Acquire::http::Timeout "20";
Acquire::https::Timeout "20";
EOF

echo 'Effective Ubuntu mirror list:'
if [[ -f /etc/apt/apt-mirrors.txt ]]; then cat /etc/apt/apt-mirrors.txt; fi

timeout --signal=TERM --kill-after=30s 12m "$PW" install --with-deps "${BROWSERS[@]}"
