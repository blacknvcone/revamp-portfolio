#!/usr/bin/env bash
#
# Reads a .env file and outputs Kubernetes Secret 'data' block
# with base64-encoded values.
#
# Usage:
#   ./scripts/env-to-base64.sh apps/cms/.env
#   ./scripts/env-to-base64.sh apps/cms/.env > apps/cms/infra/secret-data.yaml
#

set -euo pipefail

ENV_FILE="${1:-}"

if [[ -z "$ENV_FILE" ]]; then
  echo "Usage: $0 <path-to-.env-file>" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: file not found: $ENV_FILE" >&2
  exit 1
fi

echo "data:"

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip empty lines and comments
  [[ -z "$line" ]] && continue
  [[ "$line" =~ ^[[:space:]]*# ]] && continue

  # Split on first '=' only
  key="${line%%=*}"
  value="${line#*=}"

  # Skip if no '=' was present
  [[ "$key" == "$line" ]] && continue

  # Trim whitespace from key
  key="$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

  # Base64 encode the value (no newline)
  encoded="$(printf '%s' "$value" | base64)"

  # Output with comment showing the decode command for verification
  echo "  # echo -n \"$value\" | base64"
  echo "  $key: $encoded"
done < "$ENV_FILE"
