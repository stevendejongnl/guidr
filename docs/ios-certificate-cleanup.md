# iOS Certificate Limit Fix

## Problem

The iOS build is failing with:
```
error: Choose a certificate to revoke. Your account has reached the maximum number of certificates.
error: No profiles for 'com.guidr' were found
```

## Root Cause

Apple Developer accounts have certificate limits:
- **Development certificates**: 2 per account
- **Distribution certificates**: 3 per account

When using automatic signing (`-allowProvisioningUpdates`), Xcode tries to create a new certificate if none are found. When the limit is reached, it cannot proceed.

## Solution: Revoke Unused Certificates

### Step 1: Access Apple Developer Portal

1. Go to https://developer.apple.com/account
2. Sign in with your Apple ID
3. Navigate to **Certificates, Identifiers & Profiles**

### Step 2: Review Existing Certificates

1. Click **Certificates** in the sidebar
2. Review all certificates:
   - Check **Type** (Distribution, Development)
   - Check **Expiration Date**
   - Check **Associated Apps/Profiles**

### Step 3: Revoke Unused/Expired Certificates

**Identify candidates for revocation:**
- Expired certificates (already invalid)
- Certificates for old/test projects
- Certificates not used in production
- Duplicate certificates

**To revoke:**
1. Click on the certificate
2. Click **Revoke** button
3. Confirm the revocation

**Recommendation**: Revoke at least 1 distribution certificate to allow automatic provisioning to create a new one.

### Step 4: Clean Up Provisioning Profiles

1. Navigate to **Profiles** in the sidebar
2. Delete profiles associated with revoked certificates
3. Let Xcode recreate them automatically

### Step 5: Retry the Workflow

After revoking certificates:

```bash
# Manually trigger TestFlight workflow
gh workflow run testflight-deploy.yml --repo stevendejongnl/guidr
```

Or wait for the next release to trigger it automatically.

## Alternative: Manual Certificate Management

If you want to avoid automatic provisioning and manage certificates manually:

### Option 1: Use Existing Certificate

1. Download valid certificate from Apple Developer Portal
2. Export as .p12 file
3. Store in GitHub Secrets as base64:
   ```bash
   base64 -i certificate.p12 | pbcopy
   ```
4. Update workflow to use manual signing

### Option 2: Use Fastlane Match

Fastlane Match manages certificates in a git repository:

```bash
# Setup
bundle exec fastlane match init

# Create/sync certificates
bundle exec fastlane match appstore
```

This approach is better for teams but requires additional setup.

## Prevention

**Best Practices:**
1. Use automatic provisioning for CI/CD (current approach)
2. Regularly audit and revoke unused certificates
3. Keep track of certificate expiration dates (1 year for distribution)
4. Consider using Fastlane Match for team environments

## Current Workflow Configuration

The workflow uses automatic provisioning:

```yaml
xcodebuild \
  -allowProvisioningUpdates \
  -authenticationKeyPath ... \
  CODE_SIGN_STYLE=Automatic \
  archive
```

This is the recommended approach for CI/CD as it:
- Automatically creates/reuses certificates
- Handles provisioning profiles
- Requires only App Store Connect API key (no manual certificate management)

The issue only occurs when the certificate limit is reached.

## Quick Fix (Recommended)

1. Go to https://developer.apple.com/account/resources/certificates/list
2. Find and revoke 1-2 oldest distribution certificates
3. Retry the GitHub Actions workflow

This should resolve the issue immediately.
