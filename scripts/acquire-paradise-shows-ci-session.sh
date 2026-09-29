#!/usr/bin/env bash
set -euo pipefail

: "${ACTIONS_ID_TOKEN_REQUEST_URL:?GitHub OIDC request URL unavailable}"
: "${ACTIONS_ID_TOKEN_REQUEST_TOKEN:?GitHub OIDC request token unavailable}"
: "${PARADISE_SHOWS_API:=https://taxlrlfsobtnbasjcnuf.supabase.co/functions/v1/shows-api}"

separator='?'
[[ "$ACTIONS_ID_TOKEN_REQUEST_URL" == *'?'* ]] && separator='&'
oidc_json="$(curl --retry 4 --retry-delay 2 --retry-all-errors -fsS   -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN"   "${ACTIONS_ID_TOKEN_REQUEST_URL}${separator}audience=paradise-shows-ci")"
oidc_token="$(jq -er '.value' <<<"$oidc_json")"

session_json="$(curl --retry 4 --retry-delay 2 --retry-all-errors -fsS   -X POST "$PARADISE_SHOWS_API"   -H 'Content-Type: application/json'   -H "Authorization: Bearer $oidc_token"   --data '{"action":"ciSession"}')"

session_token="$(jq -er 'select(.ok == true and .scope == "read") | .token' <<<"$session_json")"
expires_at="$(jq -er '.expires_at' <<<"$session_json")"

echo "::add-mask::$session_token"
if [[ -n "${GITHUB_ENV:-}" ]]; then
  {
    echo "PARADISE_SHOWS_SESSION=$session_token"
    echo "PARADISE_SHOWS_SESSION_EXPIRES_AT=$expires_at"
  } >> "$GITHUB_ENV"
else
  export PARADISE_SHOWS_SESSION="$session_token"
  export PARADISE_SHOWS_SESSION_EXPIRES_AT="$expires_at"
fi

echo "Paradise Shows CI read session acquired; expires $expires_at"
