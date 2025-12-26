# Guidr - Manual Setup TODO List

## Apple Developer Program Setup

### 1. Register App ID in Apple Developer Portal
**URL**: https://developer.apple.com/account/resources/identifiers

- [ ] Click "+" to create new identifier
- [ ] Select "App IDs" → Continue
- [ ] Type: Select "App"
- [ ] Description: Enter "Guidr - Step-by-step guide execution"
- [ ] Bundle ID: Select "Explicit" → Enter `com.guidr`
- [ ] Capabilities:
  - [ ] Enable "App Groups"
  - [ ] Enable "Keychain Sharing"
- [ ] Click "Continue" → "Register"

### 2. Configure App Groups
**URL**: https://developer.apple.com/account/resources/identifiers (same page)

- [ ] Find your `com.guidr` App ID in the list
- [ ] Click to edit it
- [ ] Under "App Groups", click "Configure"
- [ ] Click "+" to create new App Group
- [ ] Identifier: Enter `group.com.guidr`
- [ ] Description: Enter "Guidr App Group"
- [ ] Click "Continue" → "Register"
- [ ] Go back to App ID configuration
- [ ] Under "App Groups", select the `group.com.guidr` you just created
- [ ] Click "Save"

### 3. Get Your Apple Team ID
**URL**: https://developer.apple.com/account (Membership section)

- [ ] Go to https://developer.apple.com/account
- [ ] Click "Membership" in the left sidebar
- [ ] Find and copy your **Team ID** (10 alphanumeric characters)
- [ ] Save this value - you'll need it for GitHub Secrets
- [ ] Format example: `A1B2C3D4E5`

### 4. Create App in App Store Connect
**URL**: https://appstoreconnect.apple.com

- [ ] Log in to App Store Connect
- [ ] Click "My Apps"
- [ ] Click the "+" button
- [ ] Select "New App"
- [ ] Platforms: Check "iOS"
- [ ] Name: Enter "Guidr"
- [ ] Primary Language: Select "English (U.S.)"
- [ ] Bundle ID: Select `com.guidr` from dropdown
- [ ] SKU: Enter `guidr-ios` (or any unique identifier)
- [ ] User Access: Select "Full Access"
- [ ] Click "Create"

### 5. Create App Store Connect API Key
**URL**: https://appstoreconnect.apple.com/access/integrations/api

- [ ] Go to "Users and Access" (top navigation)
- [ ] Click "Integrations" tab
- [ ] Click "App Store Connect API" section
- [ ] Click "+" (Generate API Key button)
- [ ] Name: Enter "GitHub Actions CI/CD"
- [ ] Access: Select "App Manager" role
- [ ] Click "Generate"
- [ ] **IMPORTANT**: Click "Download API Key" (you can ONLY do this ONCE!)
- [ ] File downloads as: `AuthKey_XXXXXXXXXX.p8`
- [ ] **Copy and save these values**:
  - [ ] **Key ID**: Displayed on the page (10 characters, e.g., `AB1CD2EF34`)
  - [ ] **Issuer ID**: Displayed at top of page (UUID format, e.g., `12345678-abcd-1234-abcd-123456789012`)
  - [ ] **API Key Content**: Open the `.p8` file in text editor, copy entire contents including:
    ```
    -----BEGIN PRIVATE KEY-----
    [content]
    -----END PRIVATE KEY-----
    ```

### 6. Configure GitHub Secrets
**URL**: https://github.com/stevendejongnl/guidr/settings/secrets/actions

- [ ] Go to your GitHub repository
- [ ] Click "Settings" tab
- [ ] Click "Secrets and variables" → "Actions" in left sidebar
- [ ] Click "New repository secret" button for each of the following:

#### Secret 1: APPLE_TEAM_ID
- [ ] Name: `APPLE_TEAM_ID`
- [ ] Value: Your 10-character Team ID from Step 3
- [ ] Example: `A1B2C3D4E5`
- [ ] Click "Add secret"

#### Secret 2: APP_STORE_CONNECT_API_KEY_ID
- [ ] Click "New repository secret"
- [ ] Name: `APP_STORE_CONNECT_API_KEY_ID`
- [ ] Value: The Key ID from Step 5 (10 characters)
- [ ] Example: `AB1CD2EF34`
- [ ] Click "Add secret"

#### Secret 3: APP_STORE_CONNECT_ISSUER_ID
- [ ] Click "New repository secret"
- [ ] Name: `APP_STORE_CONNECT_ISSUER_ID`
- [ ] Value: The Issuer ID from Step 5 (UUID format)
- [ ] Example: `12345678-abcd-1234-abcd-123456789012`
- [ ] Click "Add secret"

#### Secret 4: APP_STORE_CONNECT_API_KEY_CONTENT
- [ ] Click "New repository secret"
- [ ] Name: `APP_STORE_CONNECT_API_KEY_CONTENT`
- [ ] Value: The COMPLETE contents of the `.p8` file from Step 5
- [ ] Must include the BEGIN and END lines:
  ```
  -----BEGIN PRIVATE KEY-----
  [multiple lines of base64 encoded content]
  -----END PRIVATE KEY-----
  ```
- [ ] Click "Add secret"

#### Verify Secrets
- [ ] Confirm all 4 secrets appear in the list:
  - `APPLE_TEAM_ID`
  - `APP_STORE_CONNECT_API_KEY_ID`
  - `APP_STORE_CONNECT_ISSUER_ID`
  - `APP_STORE_CONNECT_API_KEY_CONTENT`

---

## Testing TestFlight Workflow

### Test 1: Build Only (No Upload)
- [ ] Go to GitHub Actions: https://github.com/stevendejongnl/guidr/actions
- [ ] Click "TestFlight Deployment" workflow in left sidebar
- [ ] Click "Run workflow" dropdown (top right)
- [ ] Select branch: `main`
- [ ] Set "Skip TestFlight upload": `true` ✓
- [ ] Click "Run workflow" button
- [ ] Wait for workflow to complete (~15 minutes)
- [ ] Verify workflow succeeded (green checkmark)
- [ ] Check that signed IPA artifact was uploaded
- [ ] Download artifact and verify it's a signed IPA (not unsigned)

### Test 2: Full TestFlight Upload
- [ ] Go to GitHub Actions: https://github.com/stevendejongnl/guidr/actions
- [ ] Click "TestFlight Deployment" workflow
- [ ] Click "Run workflow" dropdown
- [ ] Select branch: `main`
- [ ] Set "Skip TestFlight upload": `false` (unchecked)
- [ ] Click "Run workflow" button
- [ ] Wait for workflow to complete (~15 minutes)
- [ ] Verify workflow succeeded
- [ ] Log in to App Store Connect: https://appstoreconnect.apple.com
- [ ] Go to "My Apps" → "Guidr"
- [ ] Click "TestFlight" tab at top
- [ ] Wait 10-15 minutes for Apple processing
- [ ] Verify build appears in "iOS Builds" section
- [ ] Build status should change from "Processing" to "Ready to Submit" or "Testing"

### Test 3: Install on Device via TestFlight
- [ ] On your iPhone/iPad, install TestFlight app from App Store
- [ ] Open App Store Connect: https://appstoreconnect.apple.com
- [ ] Go to "My Apps" → "Guidr" → "TestFlight"
- [ ] Click "Internal Testing" section (left sidebar)
- [ ] Click "+" to add yourself as internal tester
- [ ] Select your Apple ID email
- [ ] Click "Add"
- [ ] Check your email for TestFlight invite
- [ ] Open invite email on your device
- [ ] Tap "View in TestFlight" button
- [ ] TestFlight app opens showing Guidr
- [ ] Tap "Install" button
- [ ] Wait for download and installation
- [ ] Open Guidr app from home screen
- [ ] Verify app launches successfully
- [ ] Test basic functionality (navigate to server setup screen)

---

## Automatic Workflow Configuration (Already Done)

These are configured and will run automatically:

✅ **On Pull Requests**:
- Lint, test, typecheck
- Simulator build (fast validation)
- Android build

✅ **On Main Branch Push**:
- Semantic-release checks for release
- If release needed:
  - Creates version tag
  - Builds unsigned IPA (AltStore)
  - Builds Android APK
  - Triggers TestFlight workflow

✅ **On Version Tags** (created by semantic-release):
- TestFlight workflow runs automatically
- Builds signed IPA
- Uploads to TestFlight
- No manual intervention needed

✅ **Manual Trigger** (when needed):
- TestFlight Deployment workflow can be triggered manually
- Useful for testing or one-off builds

---

## Cost Information (Updated)

### GitHub Actions Costs

**If your repository is PUBLIC** (recommended):
- ✅ **Completely FREE** - unlimited minutes for public repos
- No costs for any builds (simulator, Android, or TestFlight)

**If your repository is PRIVATE**:
- **Free Tier**: 2,000 minutes/month
- **macOS runners**: Count as 10x (10 minutes per 1 actual minute)
- **Ubuntu runners**: Count as 1x

**Monthly estimate (private repo)**:
- TestFlight build: 15 actual minutes = 150 counted minutes
- Simulator build: 2 actual minutes = 20 counted minutes
- Android build: 5 actual minutes = 5 counted minutes

**Free allowance (private repo)**:
- With 2,000 free minutes/month you can do:
  - ~13 TestFlight builds/month FREE
  - ~100 simulator builds/month FREE
  - ~400 Android builds/month FREE
- Typical usage (20 PRs, 4 releases): ~580 minutes/month
- **Result**: Completely within free tier, $0 cost

**Apple Developer Program**:
- $99/year (already paid) ✅
- No additional costs for TestFlight distribution
- Up to 10,000 external testers (free)
- Unlimited internal testers (free)

---

## Troubleshooting Resources

If you encounter issues, check:
- [ ] CLAUDE.md - Full TestFlight documentation with troubleshooting section
- [ ] GitHub Actions logs for detailed error messages
- [ ] App Store Connect → Activity tab for build processing status
- [ ] Email from Apple for any build rejection reasons

Common issues and solutions are documented in CLAUDE.md lines 504-532.

---

## Completion Checklist

Before considering setup complete:
- [ ] All Apple Developer Portal steps completed (Steps 1-5)
- [ ] All GitHub Secrets configured (Step 6)
- [ ] Test 1 passed: Build-only workflow succeeded
- [ ] Test 2 passed: Upload to TestFlight succeeded
- [ ] Test 3 passed: App installed and launched on device
- [ ] App Store Connect shows build in TestFlight
- [ ] You can install Guidr from TestFlight on your device
- [ ] App launches and basic functionality works

**Estimated time**: 2-3 hours total

**Once complete**: All future builds will happen automatically when you push code to main!
