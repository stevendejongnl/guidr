# ADR 015: Accepted Security Vulnerabilities

**Covers**: ECDSA timing attack (CVE-2024-23342), tar file overwrite (CVE-2026-23745), jsdiff DoS (GHSA-73rr-hh4g-fpgx)

## Status
Accepted

## Context

The Guidr API server uses `python-jose[cryptography]` for JWT token handling, which depends on the `ecdsa` library. A timing vulnerability (CVE-2024-23342, GHSA-wj6h-64fc-37mp) exists in `ecdsa` versions prior to 0.19.0 that allows potential extraction of private keys through repeated timing measurements of P-256 signing operations.

**Key Facts**:
- **Vulnerability**: Minerva timing attack on P-256 curves in pure Python ECDSA implementation
- **Affected Library**: `ecdsa` (no maximum affected version specified - issue open)
- **Severity**: HIGH (remote timing attack on cryptographic keys)
- **Current Status**: Maintainers stated timing attacks are out of scope for pure Python implementation
- **No Available Fix**: Latest ecdsa version still vulnerable; maintainers recommend using hardware-accelerated implementations

**Dependency Chain**:
```
api-server → python-jose[cryptography] → ecdsa
```

## Decision

We accept this vulnerability with documented mitigation strategies rather than replacing `python-jose` with `PyJWT`. The rationale:

1. **Low Practical Risk**:
   - Timing attacks require repeated measurements of signing operations
   - Extracting keys requires thousands of measurements with sub-millisecond precision
   - API rate limiting mitigates repeated measurement attacks

2. **Operational Barriers**:
   - Attacker needs network-level timing access (unlikely in cloud/containerized environments)
   - Guidr tokens are short-lived (configurable expiry), reducing attack window
   - Admin operations (token signing) are infrequent compared to token validation

3. **Engineering Trade-offs**:
   - Switching to `PyJWT`: Requires API refactoring, breaking token format change, potential deployment complexity
   - Documenting Risk: No code changes, minimal operational overhead, allows time for upstream fix

## Consequences

### Positive
- **Minimal Code Changes**: No refactoring of auth system or API contracts
- **Maintainability**: Continued use of `python-jose` (established library with ecosystem support)
- **Flexibility**: Can migrate to `PyJWT` or hardware-accelerated ECDSA in future when practical
- **Team Alignment**: Risk documented and understood by all developers

### Negative
- **Known Vulnerability**: ecdsa timing attack remains in dependency tree
- **No Upstream Fix**: Reliant on maintainer decision to fix pure Python implementation
- **Ongoing Risk**: Requires quarterly reviews for new ECDSA vulnerability information

## Mitigation Strategies

### 1. API Rate Limiting
- Implement rate limiting on token validation endpoints (already deployed)
- Prevents attackers from collecting thousands of timing measurements quickly
- Scope: Apply to `/api/auth/` endpoints and token refresh flows

### 2. Short-Lived Tokens
- Configure JWT expiry to 1 hour (or less) for access tokens
- Limits the time window an attacker has to extract keys from a token
- Refresh tokens with longer expiry stored securely (HttpOnly cookies)

### 3. Monitoring & Alerting
- Monitor API logs for unusual token validation patterns
- Alert on repeated failed validation attempts from same IP
- Track dependency updates for new ECDSA vulnerability information

### 4. Key Rotation
- Implement monthly key rotation for signing keys
- Invalidates any partially-extracted keys from timing attacks
- Schedule: Automate key rotation in deployment pipeline

## Implementation

### Files Modified

**Configuration**:
- `api-server/.pip-audit.toml`: Suppress CVE-2024-23342 with justification

**Environment Variables** (if not already set):
- `JWT_EXPIRY_SECONDS`: Set to 3600 (1 hour) for access tokens
- `REFRESH_TOKEN_EXPIRY_SECONDS`: Set to 2592000 (30 days) for refresh tokens

### pip-audit Suppression

Create `api-server/.pip-audit.toml`:
```toml
[pip-audit]
ignore-vulns = [
    "GHSA-wj6h-64fc-37mp",  # CVE-2024-23342 - ecdsa timing attack (documented in ADR-015)
]
```

Run: `cd api-server && uv sync --dev`

Add to security scanning scripts:
```bash
pip-audit --desc --skip-editable --require-hashes uv.lock
# Will skip CVE-2024-23342 per .pip-audit.toml configuration
```

### Quarterly Review Checklist

Every quarter (Jan, Apr, Jul, Oct), review:
1. Check ecdsa GitHub repository for new releases/fixes (API)
2. Review CVE databases for new ECDSA timing vulnerabilities
3. Check npm CLI releases at https://github.com/npm/cli/releases (Mobile)
   - Verify if npm includes tar@7.5.3 or higher
   - Verify if npm includes diff@8.0.3 or higher
4. Update @semantic-release/npm if newer npm CLI is available
5. Assess `PyJWT` adoption in ecosystem (alternative option for ecdsa)
6. Document findings in security incident log

---

## 2. tar <=7.5.2 (CVE-2026-23745) - npm CLI Bundled Dependency

**Status**: Documented and accepted (waiting for upstream npm CLI update)

**Vulnerability**:
- Arbitrary file overwrite via hardlinks and symlink poisoning
- Affects tar extraction in node-tar <=7.5.2
- CVSS 8.2 (HIGH severity)

**Location**:
- mobile → @semantic-release/npm → npm@11.7.0 (bundled) → tar@7.5.2

**Why we can't fix it**:
- tar is bundled inside npm CLI package (not a regular dependency)
- npm overrides don't affect bundled packages
- Requires npm CLI to release version with tar@7.5.3 bundled

**Risk Assessment**:
- **Low practical risk** for our use case:
  - Only affects semantic-release in CI/CD (not production code or local development)
  - npm only extracts from trusted registry (npmjs.com)
  - Attacker would need to compromise npmjs.com or perform man-in-the-middle attack
  - Extraction happens in isolated CI/CD containers

**Mitigation**:
1. Monitor npm CLI releases: https://github.com/npm/cli/releases
2. Update @semantic-release/npm when newer npm CLI with tar@7.5.3 is available
3. Quarterly review for npm CLI updates (Jan, Apr, Jul, Oct)
4. CI/CD runs in isolated containers (limits blast radius)

**Alternative (Not Recommended)**:
- Use `npx semantic-release@latest` in GitHub Actions (always pulls latest)
- Trade-off: Slower CI (downloads each time), less reproducible builds, doesn't fix bundled vulnerabilities

---

## 3. diff <8.0.3 (GHSA-73rr-hh4g-fpgx) - npm CLI Bundled Dependency

**Status**: Documented and accepted (waiting for upstream npm CLI update)

**Vulnerability**:
- jsdiff DoS vulnerability in parsePatch and applyPatch
- CVSS 2.5 (LOW severity)

**Location**:
- mobile → @semantic-release/npm → npm@11.7.0 (bundled) → diff@8.0.2

**Why we can't fix it**:
- Same as tar: bundled inside npm CLI
- Cannot be overridden at package.json level

**Risk Assessment**:
- **Very low risk**: CVSS 2.5 is minimal severity
- Only affects CI/CD tooling, not production code
- Requires malicious input to patch files during npm CLI operations

**Mitigation**:
- Monitor npm CLI releases (same as tar)
- Low priority due to minimal severity (CVSS 2.5)
- Update when npm CLI includes diff@8.0.3

---

## Verification

### Security Scanning
```bash
# Run security scan with suppression
cd api-server
pip-audit --desc --skip-editable --require-hashes uv.lock
# Expected: CVE-2024-23342 suppressed, other vulnerabilities listed (if any)
```

### Dependency Check
```bash
pip show ecdsa
# Expected: Shows current ecdsa version (no fix available yet)
```

### Deployment Verification
```bash
# Verify token settings in deployed API
curl -X GET https://guidr.madebysteven.nl/api/health
# Verify API returns 200 OK (rate limiting not triggered)

# Check logs for token validation patterns
# Expected: No unusual timing patterns, no repeated failures from same IP
```

### npm Dependencies Verification
```bash
# Check tar and diff versions in npm CLI
npm --prefix mobile ls tar
# Expected: tar@7.5.2 (bundled in npm) - documented in ADR-015

npm --prefix mobile ls diff
# Expected: diff@8.0.2 (bundled in npm) - documented in ADR-015

# Run security scan for mobile
npm --prefix mobile audit
# Expected: Only tar and diff vulnerabilities (both bundled in npm CLI)
```

## Alternative Approaches Considered

### 1. Switch to PyJWT (Rejected)
**Pros**:
- Uses cryptography library (hardware-accelerated ECDSA on some platforms)
- Different attack surface (different Python implementation)

**Cons**:
- Requires API refactoring (different token format, payload structure)
- Breaking change for mobile/web clients (token format incompatible)
- Testing burden for token migration
- Deployment complexity (dual support period during migration)

**Decision**: Defer until practical need (e.g., cryptography library becomes required for other features)

### 2. Use Hardware-Accelerated Crypto (Rejected - Future Option)
**Option**: Use `cryptography` library directly via `PyJWT`
**Decision**: Deferred - consider if `cryptography` becomes dependency for other features

### 3. Immediate Fix Required (Rejected)
**Option**: Force ecdsa version < vulnerable range (doesn't exist - no upper bound fix)
**Decision**: Rejected - no available fix at any ecdsa version

## Related ADRs

- [ADR-002](./002-jwt-authentication-middleware.md): JWT authentication middleware
- [ADR-006](./006-admin-user-authorization.md): Admin user authorization

## References

- [CVE-2024-23342](https://nvd.nist.gov/vuln/detail/CVE-2024-23342)
- [GitHub Advisory: GHSA-wj6h-64fc-37mp](https://github.com/advisories/GHSA-wj6h-64fc-37mp)
- [ecdsa GitHub Issues](https://github.com/tlsfuzzer/python-ecdsa/issues)
- [Minerva Timing Attack Paper](https://minerva.crocs.fi.muni.cz/)
- [PyJWT Alternative](https://github.com/jpadilla/pyjwt)
- [cryptography Library](https://cryptography.io/)
