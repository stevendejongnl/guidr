# Security Policy

## Vulnerability Disclosure

Guidr is a personal project with security measures in place for the safety of its users. If you discover a security vulnerability, please follow responsible disclosure practices:

1. **Do NOT** open a public GitHub issue
2. Contact the maintainer privately (project contact information)
3. Allow time for patches before public disclosure

## Supported Versions

| Version | Status | Security Patches |
|---------|--------|------------------|
| 1.x     | Active | Yes              |
| < 1.0   | EOL    | No               |

## Security Measures

### Dependency Management

- **npm packages** (mobile, web): Regular audits with npm audit, severity threshold: HIGH
- **Python packages** (API): pip-audit with known vulnerability suppression list
- **Automated Scanning**: Pre-push hooks block pushes with unresolved security vulnerabilities
- **Update Strategy**: Monthly dependency updates, manual review of security advisories

### Code Security

- **Authentication**: JWT-based with python-jose[cryptography]
- **Password Hashing**: Argon2 via argon2-cffi
- **Input Validation**: Pydantic for API schemas, TypeScript type safety
- **API Rate Limiting**: Protects against timing attacks and abuse
- **Error Handling**: Secure error messages (no sensitive data exposure)

### Infrastructure

- **API**: FastAPI with input validation, CORS protection
- **Token Expiry**: Configurable JWT expiry (default: 1 hour for access tokens)
- **HTTPS**: Required for production API endpoints
- **Database**: MongoDB with secure connection strings (environment variables)

## Known Vulnerabilities

### Accepted Risks

#### API Server

**CVE-2024-23342** (ecdsa timing attack on P-256)
- **Status**: Documented and accepted
- **Severity**: HIGH (CVSS 7.5)
- **Scope**: devDependencies only (runtime uses hardware-accelerated crypto)
- **Risk Assessment**: Low practical risk (API rate limiting, short-lived tokens)
- **Location**: API → python-jose[cryptography] → ecdsa
- **Mitigation**: Rate limiting, short-lived tokens, quarterly reviews, key rotation
- **Reference**: [ADR-015](./docs/adr/015-ecdsa-timing-attack-mitigation.md)

#### Mobile (React Native)

**Semantic-Release Bundled Dependencies** (dev-time only)
- **GHSA-8qq5-rm4j-mr97** (tar file overwrite): HIGH - Bundled in npm CLI
- **GHSA-5j98-mcp5-4vw2** (glob command injection): HIGH - Bundled in npm CLI
- **GHSA-73rr-hh4g-fpgx** (jsdiff DoS): LOW - Bundled in npm CLI
- **Status**: Accepted (dev-time dependencies only)
- **Scope**: devDependencies only (not runtime/production)
- **Risk Assessment**: Minimal - only affects trusted dev machines and CI runners
- **Reason Accepted**:
  - Cannot be fixed via npm overrides (architectural limitation)
  - Removing plugins breaks release CI/CD pipeline
  - No end-user exposure (dev tooling only)
  - Already accepted similar risks (CVE-2024-23342)
- **Mitigation**: Custom audit script filters known vulnerabilities, quarterly reviews
- **Reference**: [ADR-015](./docs/adr/015-ecdsa-timing-attack-mitigation.md) (Section 2)

### Resolved Vulnerabilities

- **CVE-2022-21670** (markdown-it DoS): Fixed via npm override to v12.3.2
- **CVE-2026-22036** (undici unbounded decompression): Fixed via npm override to v7.18.2

## Security Best Practices

### Development

1. **Code Review**: All changes reviewed before merge
2. **Type Safety**: Strict TypeScript/Python types (no `any`/`Any` except documented exceptions)
3. **Testing**: Test-Driven Development (TDD) with comprehensive test coverage
4. **Linting**: Automated linting and security checks on all code

### Deployment

1. **Environment Secrets**: Store credentials in `.env` files (gitignored)
2. **HTTPS Only**: API endpoints require HTTPS in production
3. **Dependency Pinning**: Locked dependencies in `package-lock.json` and `uv.lock`
4. **Key Rotation**: Quarterly rotation of JWT signing keys (scheduled)

### Monitoring

- API error logs monitored for security issues
- Failed authentication attempts tracked
- Rate limiting thresholds monitored for abuse patterns

## Security Commands

### Local Development

```bash
# Run all security scans
npm run security:all

# Run specific package scans
npm run security:mobile        # npm audit for mobile
npm run security:web           # npm audit for web
npm run security:api           # pip-audit for API

# Auto-fix npm vulnerabilities
npm run security:fix:mobile    # Mobile auto-fix
npm run security:fix:web       # Web auto-fix
```

### Pre-Push Verification

Security scans run automatically before each push. To manually test:

```bash
# Run all security scans (uses custom npm audit wrapper for mobile)
npm run security:all
# Expected: All scans pass with documented vulnerabilities suppressed

# Manual mobile security scan (with accepted vulnerabilities filtered)
./scripts/npm-audit-security.sh ./mobile high
# Expected: Exit code 0, message "Only accepted vulnerabilities found"

# Web security scan (no accepted vulnerabilities)
npm --prefix web-app audit --audit-level=high
# Expected: No vulnerabilities

# API security scan (with ecdsa timing attack documented)
cd api-server && .venv/bin/pip-audit --desc --skip-editable --ignore-vuln GHSA-wj6h-64fc-37mp
# Expected: GHSA-wj6h-64fc-37mp ignored (ecdsa timing attack, documented in ADR-015)

# Simulate full pre-push checks
./.husky/pre-push
# Expected: All security checks pass, tests pass
```

## Security Review Checklist

**Quarterly (Jan, Apr, Jul, Oct)**:
- [ ] Review GitHub Security Advisories
- [ ] Check for new ecdsa vulnerability updates (ADR-015)
- [ ] Audit API logs for suspicious patterns
- [ ] Test rate limiting effectiveness
- [ ] Review dependency update candidates
- [ ] Verify HTTPS configuration
- [ ] Check key rotation schedule

**Monthly**:
- [ ] Run full security scan suite
- [ ] Review failed authentication logs
- [ ] Update dependencies to patch versions
- [ ] Verify pre-push hooks are working

## References

- [ADR-015: ECDSA Timing Attack Mitigation](./docs/adr/015-ecdsa-timing-attack-mitigation.md)
- [ADR-002: JWT Authentication Middleware](./docs/adr/002-jwt-authentication-middleware.md)
- [ADR-006: Admin User Authorization](./docs/adr/006-admin-user-authorization.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/security)
- [pip-audit Documentation](https://github.com/pypa/pip-audit)
