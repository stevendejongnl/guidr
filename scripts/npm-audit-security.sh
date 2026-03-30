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
# - GHSA-jmr7-xgp7-cmfj: fast-xml-parser DoS via DOCTYPE entity expansion (CRITICAL, @react-native-community/cli dev tool only)
# - GHSA-m7jm-9gc2-mpf2: fast-xml-parser entity encoding bypass (HIGH, @react-native-community/cli dev tool only)
# - GHSA-3ppc-4f35-3m26: minimatch ReDoS via repeated wildcards (HIGH, eslint/jest/babel dev tools only, fix requires breaking major version bump)
# - GHSA-2g4f-4pwh-qvx6: ajv ReDoS with $data option (MODERATE, in eslint devDependency, fix locked by peer deps)
# - GHSA-83g3-92jg-28cx: node-tar hardlink symlink escape (HIGH, bundled in npm CLI internals, not overridable)
# - GHSA-fj3w-jwp8-x2g3: fast-xml-parser stack overflow in XMLBuilder (HIGH, @react-native-community/cli dev tool only, fix in >=4.5.4, override pending safe-chain age requirement)
# - GHSA-8gc5-j5rx-235r: fast-xml-parser numeric entity expansion DoS incomplete fix (HIGH, @react-native-community/cli dev tool only, same root cause as GHSA-jmr7-xgp7-cmfj)
# - GHSA-7r86-cg39-jmmj: minimatch ReDoS via non-adjacent GLOBSTAR (HIGH, bundled in npm CLI internals, not overridable)
# - GHSA-23c5-xmqv-rm74: minimatch ReDoS via nested *() extglobs (HIGH, bundled in npm CLI internals, not overridable)
# - GHSA-mw96-cpmx-2vgc: rollup arbitrary file write via path traversal (HIGH, web build tool dev-time only, fix in >=4.59.0, override pending safe-chain age requirement)
# - GHSA-qffp-2rhf-9h96: tar hardlink path traversal via drive-relative linkpath (HIGH, bundled in npm CLI internals, not overridable)
# - GHSA-9ppj-qmqm-q256: node-tar symlink path traversal via drive-relative linkpath (HIGH, bundled in npm CLI internals, not overridable)
# - GHSA-f269-vfmq-vjvj: undici WebSocket 64-bit length overflow (HIGH, @semantic-release/github dev dep only, not runtime)
# - GHSA-2mjp-6q6p-2qxm: undici HTTP request/response smuggling (HIGH, @semantic-release/github dev dep only, not runtime)
# - GHSA-vrm6-8vpv-qv8q: undici WebSocket permessage-deflate memory consumption (HIGH, @semantic-release/github dev dep only, not runtime)
# - GHSA-v9p9-hfj2-hcw8: undici invalid server_max_window_bits unhandled exception (MODERATE, @semantic-release/github dev dep only, not runtime)
# - GHSA-4992-7rv2-5pvq: undici CRLF injection via upgrade option (HIGH, @semantic-release/github dev dep only, not runtime)
# - GHSA-phc3-fgpg-7m6h: undici DeduplicationHandler unbounded memory DoS (HIGH, @semantic-release/github dev dep only, not runtime)
# - GHSA-jp2q-39xq-3w4g: fast-xml-parser entity expansion bypass via DOCTYPE (CRITICAL, @react-native-community/cli dev tool only, same root cause as GHSA-jmr7-xgp7-cmfj)
# - GHSA-rf6f-7fwh-wjgh: flatted Prototype Pollution via parse() (HIGH, mobile devDependency only, not runtime)
# - GHSA-48c2-rrv3-qjmp: yaml stack overflow via deeply nested YAML collections (MODERATE, yaml is a devDependency/build tool, not runtime)
# - GHSA-f886-m6hf-6m8v: brace-expansion Zero-step sequence DoS (MODERATE, eslint/jest devDeps only, not runtime)
# - GHSA-xjpj-3mr7-gcpf: Handlebars.js JS injection in CLI Precompiler (CRITICAL, semantic-release devDep chain only, not runtime)
# - GHSA-xhpv-hc6g-r9c6: Handlebars.js JS injection via AST Type Confusion partial (CRITICAL, semantic-release devDep chain only)
# - GHSA-9cx6-37pm-9jff: Handlebars.js DoS via malformed decorator syntax (HIGH, semantic-release devDep chain only)
# - GHSA-3mfm-83xf-c92r: Handlebars.js JS injection via @partial-block AST (HIGH, semantic-release devDep chain only)
# - GHSA-2w6w-674q-4c4q: Handlebars.js JS injection via AST Type Confusion (HIGH, semantic-release devDep chain only)
# - GHSA-2qvq-rjwj-gvw9: Handlebars.js Prototype Pollution via partial template (HIGH, semantic-release devDep chain only)
# - GHSA-7rx3-28cr-v5wh: Handlebars.js Prototype Method access control gap (HIGH, semantic-release devDep chain only)
# - GHSA-442j-39wm-28r2: Handlebars.js property access validation bypass (HIGH, semantic-release devDep chain only)
# - GHSA-3v7f-55p6-f55p: picomatch method injection in POSIX char classes (HIGH, jest/rollup devDeps only, not runtime)
# - GHSA-c2c7-rcm5-vvqj: picomatch ReDoS via extglob quantifiers (HIGH, jest/rollup devDeps only, not runtime)
# - GHSA-v3rj-xjv7-4jmq: smol-toml DoS via consecutive commented lines (MODERATE, mobile devDependency only, not runtime)

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
  "GHSA-jmr7-xgp7-cmfj"
  "GHSA-m7jm-9gc2-mpf2"
  "GHSA-3ppc-4f35-3m26"
  "GHSA-2g4f-4pwh-qvx6"
  "GHSA-83g3-92jg-28cx"
  "GHSA-fj3w-jwp8-x2g3"
  "GHSA-8gc5-j5rx-235r"
  "GHSA-7r86-cg39-jmmj"
  "GHSA-23c5-xmqv-rm74"
  "GHSA-mw96-cpmx-2vgc"
  "GHSA-qffp-2rhf-9h96"
  "GHSA-9ppj-qmqm-q256"
  "GHSA-25h7-pfq9-p65f"
  "GHSA-f269-vfmq-vjvj"
  "GHSA-2mjp-6q6p-2qxm"
  "GHSA-vrm6-8vpv-qv8q"
  "GHSA-v9p9-hfj2-hcw8"
  "GHSA-4992-7rv2-5pvq"
  "GHSA-phc3-fgpg-7m6h"
  "GHSA-jp2q-39xq-3w4g"
  "GHSA-rf6f-7fwh-wjgh"
  "GHSA-48c2-rrv3-qjmp"
  "GHSA-f886-m6hf-6m8v"
  "GHSA-xjpj-3mr7-gcpf"
  "GHSA-xhpv-hc6g-r9c6"
  "GHSA-9cx6-37pm-9jff"
  "GHSA-3mfm-83xf-c92r"
  "GHSA-2w6w-674q-4c4q"
  "GHSA-2qvq-rjwj-gvw9"
  "GHSA-7rx3-28cr-v5wh"
  "GHSA-442j-39wm-28r2"
  "GHSA-3v7f-55p6-f55p"
  "GHSA-c2c7-rcm5-vvqj"
  "GHSA-v3rj-xjv7-4jmq"
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
  exit 0
fi
