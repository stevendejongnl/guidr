#!/usr/bin/env bash

# npm-audit-security.sh - Run npm audit and fail on any unaccepted HIGH/CRITICAL vulnerabilities
# Usage: npm-audit-security.sh [prefix-path] [exit-level] [workspace]
#
# Runs npm audit at the given severity level (default: high) and filters out
# any advisories that have been explicitly accepted below.
#
# Accepted GHSA advisories: currently none.
# All previously accepted entries were fixed via npm audit fix on 2026-05-11.
#
# If a new vulnerability appears that requires acceptance, document it here:
# Format: # - GHSA-xxxx-xxxx-xxxx: description (SEVERITY, reason it can't be fixed)
#

set -e

PREFIX_PATH="${1:-.}"
AUDIT_LEVEL="${2:-high}"
WORKSPACE="${3:-}"

# GHSA advisories to accept (dev-time only, genuinely unfixable without breaking changes)
ACCEPTED_ADVISORIES=(
  # esbuild <=0.24.2 CORS bypass in dev server (MODERATE)
  # Transitive via vite; fix requires vite@8 which is a breaking change.
  # Risk is limited to the local dev server — no exposure in production builds.
  "GHSA-67mh-4wv8-2f99"
)

# Run npm audit and capture output
if [ -n "$WORKSPACE" ]; then
  AUDIT_OUTPUT=$(npm audit --workspace="$WORKSPACE" --audit-level="$AUDIT_LEVEL" 2>&1 || true)
else
  AUDIT_OUTPUT=$(npm audit --prefix "$PREFIX_PATH" --audit-level="$AUDIT_LEVEL" 2>&1 || true)
fi

# Check if output contains any unaccepted vulnerabilities
UNACCEPTED_FOUND=false

# Get list of all GHSAs in the output
while IFS= read -r line; do
  if [[ $line =~ (GHSA-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}) ]]; then
    GHSA="${BASH_REMATCH[1]}"

    # Check if this GHSA is in our accepted list
    IS_ACCEPTED=false
    for accepted in "${ACCEPTED_ADVISORIES[@]}"; do
      if [[ "$GHSA" == "$accepted" ]]; then
        IS_ACCEPTED=true
        break
      fi
    done

    # If not accepted, we have unaccepted vulnerabilities
    if [[ "$IS_ACCEPTED" == false ]]; then
      UNACCEPTED_FOUND=true
      echo "❌ Unaccepted vulnerability found: $GHSA"
    fi
  fi
done <<< "$AUDIT_OUTPUT"

# Exit appropriately
if [[ "$UNACCEPTED_FOUND" == true ]]; then
  echo "$AUDIT_OUTPUT"
  echo ""
  echo "❌ Security audit failed: Found unaccepted vulnerabilities"
  echo "   Accepted vulnerabilities: ${ACCEPTED_ADVISORIES[*]}"
  exit 1
else
  echo "✓ Security scan passed"
fi
