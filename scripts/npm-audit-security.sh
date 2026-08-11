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
# - GHSA-rgw5-rvv9-x895: brace-expansion DoS, bypass of the GHSA-mh99-v99m-4gvg mitigation (HIGH)
#     Same transitive copies/chain as GHSA-mh99-v99m-4gvg above — same root cause, same
#     dev-toolchain-only exposure, same "no fix available" status.
# - GHSA-5p4m-2wfm-xmqj: js-yaml quadratic CPU DoS via !!omap resolution (HIGH)
#     Covers both the already-accepted 3.x path (@istanbuljs/load-nyc-config, see
#     GHSA-h67p-54hq-rp68) and js-yaml@4.3.0 via eslint's @eslint/eslintrc and
#     semantic-release's cosmiconfig. Both 4.x paths only parse local config files at
#     CI/build time, never attacker-controlled YAML. Dev/CI-toolchain only.
# - GHSA-7p8r-x3mc-p8w7: fast-uri host confusion via backslash authority introducer (HIGH)
#     Transitive via @microsoft/api-extractor (TypeScript declaration bundler for shared/)
#     -> ajv@8.18.0/8.20.0 -> fast-uri@3.1.4. Build-time only, never processes untrusted
#     URIs. Attempted an override to fast-uri@^3.1.5 (including npm's nested
#     `"ajv": {"fast-uri": "..."}` override syntax) — npm's resolver does not propagate
#     either through this specific nested chain. Revisit when @microsoft/api-extractor
#     bumps its ajv dependency.
# - GHSA-w3rx-r6r6-pgpr / GHSA-5p2g-fcmc-qvqq: image-size ICNS/JXL/HEIF parser DoS (HIGH)
#     Transitive via metro -> @react-native/community-cli-plugin -> react-native. Only
#     fixable via `npm audit fix --force`, which downgrades react-native to 0.72.17 — a
#     major breaking change, not worth it for a build-tool DoS with no prod exposure
#     (image-size runs on bundler-local assets at build time, not user-supplied files).
# - GHSA-3jxr-9vmj-r5cp: brace-expansion DoS via exponential-time {} expansion (HIGH)
#     Same transitive chains as GHSA-mh99-v99m-4gvg/GHSA-rgw5-rvv9-x895 below — jest,
#     eslint, babel-plugin-module-resolver, typescript-transform-paths, api-extractor,
#     and npm's own bundled minimatch. Dev-toolchain only, no fix available upstream.
# - GHSA-mwp4-54f8-5fhr / GHSA-4xrf-jv44-h6hh / GHSA-22jq-vg5j-6vgg: ip-address SSRF /
#     trust-boundary bypass via octal/CIDR/IPv4-mapped decoding bugs (HIGH)
#     Transitive via @web/test-runner-chrome (puppeteer-core -> proxy-agent ->
#     socks-proxy-agent -> socks) for web-app's local test runner, and via npm's
#     bundled make-fetch-happen -> @npmcli/agent -> socks-proxy-agent -> socks.
#     Both paths only resolve proxy addresses for local dev/CI tooling — never parses
#     attacker-controlled IPs in the shipped app or API server. No fix available upstream.
# - GHSA-r292-9mhp-454m: tar uncontrolled recursion DoS in mapHas/filesFilter (MODERATE)
#     Bundled inside npm@11.19.0 (npm's own vendored copy), pulled in transitively via
#     @semantic-release/npm during the release CI job. `npm audit fix --force`'s only
#     suggested fix is downgrading @semantic-release/npm to 12.0.2 — a regression, not
#     a fix, since we're already on the latest 13.x line. Release-pipeline-only, never
#     processes untrusted archives. Revisit when npm ships a patched bundled tar.
# - GHSA-8xcm-r25x-g524 / GHSA-4cwx-7wf7-3272 / GHSA-m8rv-5g2x-5cg5 / GHSA-jr45-8vmc-qm54 /
#   GHSA-v3r7-h72x-cjcm: undici response desync / CRLF / cache / cookie handling bugs (HIGH)
#     Transitive via @actions/http-client (used by @semantic-release/npm and
#     @semantic-release/github for GitHub Actions annotations/API calls during the
#     release job) and npm's bundled node-gyp. Fix requires a major undici 7.x -> 8.x
#     bump that's outside @actions/http-client's/@semantic-release/github's allowed
#     range (^7.0.0) — not something this repo can force. Release-pipeline-only,
#     never touches user-facing traffic in the mobile app or API server.
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
  "GHSA-rgw5-rvv9-x895"  # brace-expansion DoS, bypass of GHSA-mh99-v99m-4gvg mitigation, same chain
  "GHSA-5p4m-2wfm-xmqj"  # js-yaml quadratic DoS, @istanbuljs 3.x + eslint/semantic-release 4.x, CI-toolchain only
  "GHSA-7p8r-x3mc-p8w7"  # fast-uri host confusion, @microsoft/api-extractor->ajv, build-time only, override attempted
  "GHSA-w3rx-r6r6-pgpr"  # image-size ICNS DoS, metro/react-native, only fixable via breaking react-native downgrade
  "GHSA-5p2g-fcmc-qvqq"  # image-size JXL/HEIF DoS, same chain as GHSA-w3rx-r6r6-pgpr
  "GHSA-3jxr-9vmj-r5cp"  # brace-expansion DoS, same dev-toolchain chain as GHSA-mh99-v99m-4gvg
  "GHSA-mwp4-54f8-5fhr"  # ip-address SSRF (octal decode), web-app puppeteer test runner + npm bundled
  "GHSA-4xrf-jv44-h6hh"  # ip-address SSRF (CIDR suffix), same chain as GHSA-mwp4-54f8-5fhr
  "GHSA-22jq-vg5j-6vgg"  # ip-address SSRF (IPv4-mapped), same chain as GHSA-mwp4-54f8-5fhr
  "GHSA-r292-9mhp-454m"  # tar recursion DoS, npm's bundled tar, only fixable via breaking semantic-release downgrade
  "GHSA-8xcm-r25x-g524"  # undici response desync, @actions/http-client release-pipeline only
  "GHSA-4cwx-7wf7-3272"  # undici cache info disclosure, same chain as GHSA-8xcm-r25x-g524
  "GHSA-m8rv-5g2x-5cg5"  # undici CRLF injection, same chain as GHSA-8xcm-r25x-g524
  "GHSA-jr45-8vmc-qm54"  # undici cache whitespace bypass, same chain as GHSA-8xcm-r25x-g524
  "GHSA-v3r7-h72x-cjcm"  # undici cookie attribute injection, same chain as GHSA-8xcm-r25x-g524
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
