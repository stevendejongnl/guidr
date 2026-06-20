#!/usr/bin/env bash

# npm-audit-security.sh - Run npm audit and fail on any unaccepted HIGH/CRITICAL vulnerabilities
# Usage: npm-audit-security.sh [prefix-path] [exit-level] [workspace]
#
# Runs npm audit at the given severity level (default: high) and filters out
# any advisories that have been explicitly accepted below.
#
# Accepted GHSA advisories (all MODERATE — no HIGH/CRITICAL are accepted):
# - GHSA-67mh-4wv8-2f99: esbuild <=0.24.2 CORS bypass (dev server, MODERATE)
#     Fixed by vite@8 upgrade — GHSA-g7r4-m6w7-qqqr (0.27.x) is from @web/dev-server-esbuild, Windows-only
# - GHSA-g7r4-m6w7-qqqr: esbuild 0.27.3-0.28.0 file read (Windows dev server only, MODERATE)
#     Transitive via @web/dev-server-esbuild and vite@7. Windows-only, dev server only. No prod risk.
# - GHSA-h67p-54hq-rp68: js-yaml <=4.1.1 quadratic DoS (MODERATE)
#     Nested 3.x in @istanbuljs/load-nyc-config (test coverage toolchain only). No fix: ^3.x.x dep.
# - GHSA-6vfc-qv3f-vr6c: markdown-it <=14.1.1 resource consumption (MODERATE)
#     In react-native-markdown-display@7. Unfixable: no newer version uses markdown-it@14+.
#     Content comes from app/server only, not arbitrary user input. Self-DoS only.
# - GHSA-6v5v-wf23-fmfq: markdown-it <=14.1.1 quadratic DoS (MODERATE)
#     Same as above.
#
# To fix a vulnerability instead of accepting it: fix the dep chain and remove from this list.

set -e

PREFIX_PATH="${1:-.}"
AUDIT_LEVEL="${2:-high}"
WORKSPACE="${3:-}"

ACCEPTED_ADVISORIES=(
  "GHSA-67mh-4wv8-2f99"  # esbuild CORS bypass, dev server, fixed by vite@8 for shared/; old @web/dev-server-esbuild path
  "GHSA-g7r4-m6w7-qqqr"  # esbuild 0.27.x file read, Windows-only, dev server
  "GHSA-h67p-54hq-rp68"  # js-yaml DoS, @istanbuljs test toolchain, no fix (^3.x dep)
  "GHSA-6vfc-qv3f-vr6c"  # markdown-it DoS, react-native-markdown-display, no fix available
  "GHSA-6v5v-wf23-fmfq"  # markdown-it DoS, same as above
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
