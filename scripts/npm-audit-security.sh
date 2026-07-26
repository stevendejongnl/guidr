#!/usr/bin/env bash

# npm-audit-security.sh - Run npm audit and fail on any unaccepted HIGH/CRITICAL vulnerabilities
# Usage: npm-audit-security.sh [prefix-path] [exit-level] [workspace]
#
# Runs npm audit at the given severity level (default: high) and filters out
# any advisories that have been explicitly accepted below.
#
# Accepted GHSA advisories (all MODERATE unless noted — HIGH entries below are
# dev-toolchain-only, transitive, and confirmed to have no fix upstream as of
# the date added; re-run `npm audit fix` periodically to see if any clear):
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
# - GHSA-22p9-wv53-3rq4 / GHSA-v245-v573-v5vm: linkify-it <=5.0.1 quadratic DoS (HIGH)
#     Transitive via markdown-it (see above) -> react-native-markdown-display@7.0.2 (latest).
#     Same unfixable chain as the markdown-it entries — no newer markdown-it/linkify-it
#     available through this dependency. Content is app/server-controlled, not user input.
# - GHSA-mh99-v99m-4gvg: brace-expansion <=5.0.7 DoS (HIGH)
#     Multiple transitive copies via jest@30.4.2's glob@^10.5.0 (minimatch@9.x ->
#     brace-expansion@2.1.2) and babel-plugin-module-resolver@5.0.3's glob@^9.3.3
#     (same chain), and eslint-plugin-react@7.37.5's minimatch@3.x (brace-expansion@1.1.16).
#     All three packages are on their latest release; the fix requires upstream jest/
#     babel-plugin-module-resolver/eslint-plugin-react releases, or a major downgrade
#     of eslint-plugin-react (npm's suggested "fix" is 7.22.0, older than current — not
#     a real fix). Dev-toolchain only (test runner, build script, linter) — no prod path.
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
  "GHSA-22p9-wv53-3rq4"  # linkify-it DoS, same markdown-it chain, no fix available
  "GHSA-v245-v573-v5vm"  # linkify-it DoS, same markdown-it chain, no fix available
  "GHSA-mh99-v99m-4gvg"  # brace-expansion DoS, dev-toolchain only (jest/babel/eslint), no fix available
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
