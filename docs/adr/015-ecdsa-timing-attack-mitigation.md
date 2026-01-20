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
3. Assess `PyJWT` adoption in ecosystem (alternative option for ecdsa)
4. Document findings in security incident log

---

## 2. tar <=7.5.2 (CVE-2026-23745) - npm CLI Bundled Dependency

**Status**: RESOLVED (2026-01-20)

**How it was fixed**:
- Removed `@semantic-release/*` packages from `mobile/package.json` devDependencies
- CI workflow already uses `npx semantic-release@latest` (no changes needed)
- Eliminates bundled npm CLI dependencies entirely from local development and package-lock.json
- Mobile now has ZERO HIGH severity vulnerabilities

**Previous Vulnerability**:
- Arbitrary file overwrite via hardlinks and symlink poisoning
- tar was bundled inside npm@11.7.0 which was bundled inside @semantic-release/npm
- CVSS 8.2 (HIGH severity) - but only affected CI/CD tooling
- Could not be overridden at package.json level (bundled packages beyond npm's override mechanism)

**Resolution Details**:
- **Reason**: semantic-release packages were only used in CI via `npx semantic-release`
- **No local use**: No `npm run release` scripts in local development
- **CI compatibility**: `.github/workflows/release.yml` already uses `npx` (lines 140, 158)
- **Result**: Both tar@7.5.2 and diff@8.0.2 removed from dependency tree entirely

---

## 3. diff <8.0.3 (GHSA-73rr-hh4g-fpgx) - npm CLI Bundled Dependency

**Status**: RESOLVED (2026-01-20)

**How it was fixed**:
- Same as tar: removed `@semantic-release/*` packages from `mobile/package.json` devDependencies
- diff was also bundled inside npm@11.7.0 in @semantic-release/npm
- Completely eliminated from dependency tree

**Previous Vulnerability**:
- jsdiff DoS vulnerability in parsePatch and applyPatch
- CVSS 2.5 (LOW severity)
- Could not be overridden at package.json level (bundled inside npm)

**Resolution Details**:
- **Same mechanism as tar fix**: Removing semantic-release devDependencies
- **No functional impact**: diff was never used directly in mobile code
- **Result**: Both diff@8.0.2 and tar@7.5.2 removed from dependency tree entirely

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
# Verify tar and diff are no longer in dependency tree
npm --prefix mobile ls tar
# Expected: (empty) - tar completely removed with semantic-release devDependencies

npm --prefix mobile ls diff
# Expected: (empty) - diff completely removed with semantic-release devDependencies

# Run security scan for mobile
npm --prefix mobile audit
# Expected: 0 vulnerabilities (tar and diff resolved)
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
