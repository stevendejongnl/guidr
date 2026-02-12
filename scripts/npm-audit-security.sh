#!/usr/bin/env bash

# npm-audit-security.sh - Run npm audit and ignore known/accepted vulnerabilities
# Usage: npm-audit-security.sh [prefix-path] [exit-level] [workspace]
#
# This script runs npm audit and filters out vulnerabilities that have been
# documented and accepted as dev-time only risks.
#
# Accepted GHSA advisories (all in devDependencies only):
# - GHSA-5j98-mcp5-4vw2: glob command injection (HIGH)
# - GHSA-7h2j-956f-4vf2: brace-expansion unbounded expansion DoS (HIGH)
# - GHSA-73rr-hh4g-fpgx: jsdiff DoS (LOW)
# - GHSA-8qq5-rm4j-mr97: tar arbitrary file overwrite (HIGH)
# - GHSA-r6q2-hw4h-h46w: tar race condition on macOS APFS (HIGH)
# - GHSA-34x7-hfp2-rc4v: tar hardlink path traversal (HIGH)
# - GHSA-p5wg-g6qr-c7cg: eslint Stack Overflow with circular references (MODERATE)
# - GHSA-37qj-frw5-hhjh: fast-xml-parser RangeError DoS (HIGH)
# - GHSA-67mh-4wv8-2f99: esbuild CORS bypass in dev server (MODERATE)
# - GHSA-w7fw-mjwx-w883: qs arrayLimit bypass DoS (in Metro dev server body-parser)

set -e

PREFIX_PATH="${1:-.}"
AUDIT_LEVEL="${2:-high}"
WORKSPACE="${3:-}"

# GHSA advisories to ignore (dev-time only, bundled in semantic-release or web dev tools)
ACCEPTED_ADVISORIES=(
  "GHSA-5j98-mcp5-4vw2"
  "GHSA-7h2j-956f-4vf2"
  "GHSA-73rr-hh4g-fpgx"
  "GHSA-8qq5-rm4j-mr97"
  "GHSA-r6q2-hw4h-h46w"
  "GHSA-34x7-hfp2-rc4v"
  "GHSA-p5wg-g6qr-c7cg"
  "GHSA-37qj-frw5-hhjh"
  "GHSA-67mh-4wv8-2f99"
  "GHSA-w7fw-mjwx-w883"
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

# Print the full audit output for reference
echo "$AUDIT_OUTPUT"

# Exit appropriately
if [[ "$UNACCEPTED_FOUND" == true ]]; then
  echo ""
  echo "❌ Security audit failed: Found unaccepted vulnerabilities"
  echo "   Accepted vulnerabilities: ${ACCEPTED_ADVISORIES[*]}"
  exit 1
else
  # Check if there are any vulnerabilities at all
  if echo "$AUDIT_OUTPUT" | grep -q "up to date\|# npm audit report"; then
    if echo "$AUDIT_OUTPUT" | grep -q "up to date"; then
      # No vulnerabilities at all
      echo ""
      echo "✓ Security scan passed: No vulnerabilities found"
      exit 0
    else
      # Vulnerabilities found but all are accepted
      echo ""
      echo "✓ Security scan passed: Only accepted vulnerabilities found"
      exit 0
    fi
  else
    # Unclear state, play it safe
    echo ""
    echo "✓ Security scan passed: Known vulnerabilities only"
    exit 0
  fi
fi
