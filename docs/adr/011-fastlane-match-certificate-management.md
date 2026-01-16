# ADR 011: Fastlane Match for iOS Certificate Management

## Status
Accepted

## Context

Guidr's iOS build workflow currently uses automatic code signing, which creates new certificates on every build. This causes two critical problems:

1. **Apple's Certificate Limit**: Apple allows maximum 3 active iOS Distribution certificates per team. Every new build hits this limit, requiring manual revocation of old certificates in Apple Developer Portal.
2. **Manual Certificate Management**: Team members building locally or running CI/CD need to manually manage certificates, leading to:
   - Frequent "provisioning profile not found" errors
   - Certificate expiration issues
   - Manual cleanup burden
   - No centralized certificate tracking

**The Problem**:
- Build on day 1: Creates certificate A
- Build on day 2: Creates certificate B
- Build on day 3: Creates certificate C (limit reached)
- Build on day 4: **FAILS** - manual certificate revocation required before retry

## Decision

Implement fastlane `match` with Gitea repository storage for iOS certificate management:

1. **Replace Automatic Signing with Manual Signing**:
   - Switch `CODE_SIGN_STYLE` from Automatic to Manual in Xcode project
   - Use fastlane match to manage certificates and provisioning profiles
   - Store encrypted certificates in existing Gitea repository (`guidr-certificates`)

2. **Certificate Storage Strategy**:
   - **Storage Backend**: Git repository (Gitea)
   - **Encryption**: Match encrypts certificates with `MATCH_PASSWORD` before pushing to git
   - **Authentication**: HTTPS with `GITEA_TOKEN` (existing pattern from gitea-access-test workflow)
   - **Network**: Cloudflare IP whitelisting for GitHub Actions access

3. **Fastlane Configuration**:
   - Create `mobile/ios/fastlane/` directory with:
     - **Fastfile**: Define lanes for `sync_certificates` (CI), `generate_certificates` (first-time), and `build_for_testflight`
     - **Matchfile**: Configure Gitea URL, auth, app identifier, team ID, certificate type
     - **Appfile**: Set app identifiers and credentials

4. **Certificate Type**: Use `appstore` type certificates (suitable for both TestFlight and App Store releases)

5. **CI/CD Integration**:
   - Add Cloudflare bypass step (IP whitelisting) for Gitea access
   - Add match sync step after CocoaPods, before xcodebuild
   - Remove `-allowProvisioningUpdates` flags (automatic provisioning)
   - Replace with manual signing parameters from match

## Consequences

### Positive
- **Certificate Reuse**: Same certificate used across multiple builds (no more 3-cert limit)
- **Team Sharing**: Any team member can build without certificate conflicts
- **Automated Sync**: `match` handles certificate management automatically
- **Encrypted Storage**: Certificates encrypted at rest (encrypted by match before git push)
- **CI/CD Simplification**: GitHub Actions doesn't need to generate certificates
- **Operational Efficiency**: No more manual Apple Developer Portal cleanup

### Negative
- **Initial Setup Complexity**: Requires one-time certificate generation
- **Password Management**: `MATCH_PASSWORD` secret must be securely managed
- **Gitea Dependency**: Certificates stored in Gitea (requires Gitea access during builds)
- **Migration Effort**: Requires updating Xcode project, ExportOptions.plist, and workflow
- **Certificate Regeneration**: If MATCH_PASSWORD lost, old certificates become unusable

### Trade-offs Accepted
- **Automatic vs Manual Signing**: Manual signing requires explicit provisioning profile management, but provides certificate reuse
- **Cloud vs Local**: Certificates stored remotely in Gitea, but encrypted (MATCH_PASSWORD provides security layer)

## Implementation

### Phase 1: Fastlane Configuration

**Files Created**:
- `mobile/ios/fastlane/Fastfile`: Three lanes (sync, generate, build)
- `mobile/ios/fastlane/Matchfile`: Match config with Gitea URL, auth, team ID
- `mobile/ios/fastlane/Appfile`: App identifiers and credentials

**Key Configuration**:
```ruby
# Matchfile
git_url("https://git.madebysteven.nl/stevendejong/guidr-certificates.git")
git_basic_authorization(ENV['GITEA_TOKEN'])
storage_mode("git")
type("appstore")
app_identifier(["com.guidr"])
team_id(ENV['APPLE_TEAM_ID'])
```

### Phase 2: Xcode Project Changes

**File: `mobile/ios/guidr.xcodeproj/project.pbxproj`**

Added to both Debug and Release buildSettings:
```
CODE_SIGN_STYLE = Manual;
CODE_SIGN_IDENTITY = "iPhone Distribution";
DEVELOPMENT_TEAM = $(APPLE_TEAM_ID);
PROVISIONING_PROFILE_SPECIFIER = "match AppStore com.guidr";
```

**File: `mobile/ios/ExportOptions.plist`**

Changed:
- `signingStyle`: automatic → manual
- Added `provisioningProfiles` mapping: `com.guidr` → `match AppStore com.guidr`

### Phase 3: Workflow Updates

**File: `.github/workflows/testflight-deploy.yml`**

**Added Steps**:
1. Cloudflare bypass (after checkout)
2. Match sync (after CocoaPods, before build)

**Modified Steps**:
1. xcodebuild archive: Removed `-allowProvisioningUpdates`, added `CODE_SIGN_STYLE=Manual`
2. xcodebuild export: Removed authentication flags (now in ExportOptions.plist)

### Phase 4: GitHub Secrets

**New Secrets**:
- `MATCH_PASSWORD`: Encryption password for certificates (generated via `openssl rand -base64 32`)
- `APPLE_ID`: Apple Developer account email

**Existing Secrets** (verified):
- GITEA_TOKEN
- APPLE_TEAM_ID
- APP_STORE_CONNECT_API_KEY_ID
- APP_STORE_CONNECT_API_KEY_CONTENT
- APP_STORE_CONNECT_ISSUER_ID
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_ZONE_ID
- CLOUDFLARE_API_TOKEN

### Phase 5: Initial Certificate Generation

**One-time Setup** (run locally):
```bash
cd mobile/ios
export GITEA_TOKEN="<token>"
export APPLE_TEAM_ID="<team-id>"
export MATCH_PASSWORD="<password>"
export APPLE_ID="<email>"

bundle exec fastlane generate_certificates
```

**Result**:
- Match generates new App Store distribution certificate in Apple Developer Portal
- Creates matching provisioning profile
- Encrypts and stores in Gitea repository

## Verification

### Local Testing
```bash
# Test match sync
cd mobile/ios
export GITEA_TOKEN="..."
export APPLE_TEAM_ID="..."
export MATCH_PASSWORD="..."
export APPLE_ID="..."

bundle exec fastlane sync_certificates
```

### CI/CD Testing
1. Trigger TestFlight Deployment workflow manually
2. Verify logs:
   - ✅ Cloudflare bypass succeeds
   - ✅ Match sync downloads certificates
   - ✅ xcodebuild archive succeeds (manual signing)
   - ✅ IPA exported successfully
   - ✅ Uploaded to TestFlight

### Certificate Reuse Verification
1. Note certificate count in Apple Developer Portal (before)
2. Run workflow multiple times
3. Certificate count remains **identical** (no new certificates created)

## Security Analysis

### Encryption Layers
1. **Match Encryption**: Certificates encrypted with MATCH_PASSWORD before git push
2. **HTTPS Transport**: GITEA_TOKEN + HTTPS authentication
3. **IP Whitelisting**: Cloudflare protection (GitHub Actions IP whitelisting)
4. **GitHub Secrets**: All sensitive values stored as encrypted secrets

### Attack Surface
- **Gitea Repo Compromise**: Attacker needs MATCH_PASSWORD to decrypt certificates
- **GITEA_TOKEN Compromise**: Attacker needs MATCH_PASSWORD to decrypt certificates
- **MATCH_PASSWORD Compromise**: Attacker can sign apps but cannot upload to App Store (needs App Store Connect credentials)

### Mitigation Strategies
- Rotate GITEA_TOKEN periodically (in Gitea settings)
- Strong MATCH_PASSWORD (32+ characters)
- Monitor Gitea repository access logs
- Regular certificate audit in Apple Developer Portal

## Rollback Plan

If match integration fails:

1. **Revert workflow**:
   ```bash
   git revert <commit-hash>
   ```

2. **Re-enable automatic signing**:
   - Change `CODE_SIGN_STYLE` from Manual to Automatic in project.pbxproj
   - Remove `CODE_SIGN_IDENTITY` and `PROVISIONING_PROFILE_SPECIFIER`
   - Revert ExportOptions.plist to automatic
   - Re-add `-allowProvisioningUpdates` flags to xcodebuild

3. **Continue with existing workflow** (accept certificate limit risk)

**Certificates created by match** remain in Apple Developer Portal and Gitea (no harm, can delete repo if needed)

## Related ADRs

- [ADR-006](./006-admin-user-authorization.md): Admin user authorization
- [ADR-007](./007-user-based-admin-mode-mobile.md): User-based admin mode
- [ADR-008](./008-rbac-and-audit-logging.md): RBAC and audit logging

## References

- [Fastlane Match Documentation](https://docs.fastlane.tools/actions/match/)
- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides)
- [Apple Code Signing Guide](https://help.apple.com/xcode/mac/current/#/dev3a05256b8)
- [Gitea Repository](https://docs.gitea.io/)
