# Guidr - Manual Setup TODO List

## Apple Developer Program Setup

### 1. Register App ID in Apple Developer Portal
**URL**: https://developer.apple.com/account/resources/identifiers

- [x] Click "+" to create new identifier
- [x] Select "App IDs" → Continue
- [x] Type: Select "App"
- [x] Description: Enter "Guidr - Step-by-step guide execution"
- [x] Bundle ID: Select "Explicit" → Enter `com.guidr`
- [x] Capabilities:
  - [x] Enable "App Groups"
- [x] Click "Continue" → "Register"

### 2. Configure App Groups
**URL**: https://developer.apple.com/account/resources/identifiers (same page)

- [x] Find your `com.guidr` App ID in the list
- [x] Click to edit it
- [x] Under "App Groups", click "Configure"
- [x] Click "+" to create new App Group
- [x] Identifier: Enter `group.com.guidr`
- [x] Description: Enter "Guidr App Group"
- [x] Click "Continue" → "Register"
- [x] Go back to App ID configuration
- [x] Under "App Groups", select the `group.com.guidr` you just created
- [x] Click "Save"

### 3. Get Your Apple Team ID
**URL**: https://developer.apple.com/account (Membership section)

- [x] Go to https://developer.apple.com/account
- [x] Click "Membership" in the left sidebar
- [x] Find and copy your **Team ID** (10 alphanumeric characters)
- [x] Save this value - you'll need it for GitHub Secrets
- [x] Format example: `A1B2C3D4E5`

### 4. Create App in App Store Connect
**URL**: https://appstoreconnect.apple.com

- [x] Log in to App Store Connect
- [x] Click "My Apps"
- [x] Click the "+" button
- [x] Select "New App"
- [x] Platforms: Check "iOS"
- [x] Name: Enter "Guidr"
- [x] Primary Language: Select "English (U.S.)"
- [x] Bundle ID: Select `com.guidr` from dropdown
- [x] SKU: Enter `guidr-ios` (or any unique identifier)
- [x] User Access: Select "Full Access"
- [x] Click "Create"

### 5. Create App Store Connect API Key
**URL**: https://appstoreconnect.apple.com/access/integrations/api

- [x] Go to "Users and Access" (top navigation)
- [x] Click "Integrations" tab
- [x] Click "App Store Connect API" section
- [x] Click "+" (Generate API Key button)
- [x] Name: Enter "GitHub Actions CI/CD"
- [x] Access: Select "App Manager" role
- [x] Click "Generate"
- [x] **IMPORTANT**: Click "Download API Key" (you can ONLY do this ONCE!)
- [x] File downloads as: `AuthKey_XXXXXXXXXX.p8`
- [x] **Copy and save these values**:
  - [x] **Key ID**: Displayed on the page (10 characters, e.g., `AB1CD2EF34`)
  - [x] **Issuer ID**: Displayed at top of page (UUID format, e.g., `12345678-abcd-1234-abcd-123456789012`)
  - [x] **API Key Content**: Open the `.p8` file in text editor, copy entire contents including:
    ```
    -----BEGIN PRIVATE KEY-----
    [content]
    -----END PRIVATE KEY-----
    ```

### 6. Configure GitHub Secrets
**URL**: https://github.com/stevendejongnl/guidr/settings/secrets/actions

- [x] Go to your GitHub repository
- [x] Click "Settings" tab
- [x] Click "Secrets and variables" → "Actions" in left sidebar
- [x] Click "New repository secret" button for each of the following:

#### Secret 1: APPLE_TEAM_ID
- [x] Name: `APPLE_TEAM_ID`
- [x] Value: Your 10-character Team ID from Step 3
- [x] Example: `A1B2C3D4E5`
- [x] Click "Add secret"

#### Secret 2: APP_STORE_CONNECT_API_KEY_ID
- [x] Click "New repository secret"
- [x] Name: `APP_STORE_CONNECT_API_KEY_ID`
- [x] Value: The Key ID from Step 5 (10 characters)
- [x] Example: `AB1CD2EF34`
- [x] Click "Add secret"

#### Secret 3: APP_STORE_CONNECT_ISSUER_ID
- [x] Click "New repository secret"
- [x] Name: `APP_STORE_CONNECT_ISSUER_ID`
- [x] Value: The Issuer ID from Step 5 (UUID format)
- [x] Example: `12345678-abcd-1234-abcd-123456789012`
- [x] Click "Add secret"

#### Secret 4: APP_STORE_CONNECT_API_KEY_CONTENT
- [x] Click "New repository secret"
- [x] Name: `APP_STORE_CONNECT_API_KEY_CONTENT`
- [x] Value: The COMPLETE contents of the `.p8` file from Step 5
- [x] Must include the BEGIN and END lines:
  ```
  -----BEGIN PRIVATE KEY-----
  [multiple lines of base64 encoded content]
  -----END PRIVATE KEY-----
  ```
- [x] Click "Add secret"

#### Verify Secrets
- [x] Confirm all 4 secrets appear in the list:
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

## GitHub Actions Cost

✅ **Completely FREE** - This is a public repository with unlimited GitHub Actions minutes

All builds cost nothing:
- TestFlight builds: FREE
- Simulator builds: FREE
- Android builds: FREE

**Apple Developer Program**: $99/year (already paid) - enables TestFlight and App Store distribution

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
