# 1Password Autofill Integration Guide

## Overview

This guide explains how to fully enable 1Password autofill verification for the Guidr mobile app. Currently, users can use 1Password autofill but will see a warning that "1Password can't verify the app or website should have access to your Guidr login."

**Current Status**: Users can tap "Allow Once" to manually approve autofill. This is functional but not ideal for user experience.

**Goal**: Enable automatic verification on both iOS and Android platforms.

## Current Behavior (Phase 1 - Implemented)

✅ Keyboard handling is fixed - keyboard no longer covers login button
✅ Return key navigation works - users can press "next" and "done" on keyboard
✅ 1Password can still autofill - users manually approve with "Allow Once"

## Phase 2: Full 1Password Verification Setup

### Why This Matters

1Password verifies that:
1. The app is legitimate and controlled by the domain owner
2. The domain has authorized the app to access login credentials
3. The connection is secure and trustworthy

Without verification, 1Password shows a warning and requires manual approval each time.

### Implementation Overview

The setup requires two main components:

1. **iOS**: Apple App Site Association (AASA) file
2. **Android**: Digital Asset Links (DAL) file
3. **Server**: Hosting these files on the domain

### Prerequisites

- Access to domain DNS/hosting (guidr.madebysteven.nl)
- Apple Developer Team ID (for iOS)
- Android app signing details (for production)
- Server configuration (nginx/apache)

---

## iOS Setup

### Step 1: Get Apple Developer Team ID

1. Open [Apple Developer Portal](https://developer.apple.com)
2. Navigate to "Account" → "Membership"
3. Find "Team ID" (format: `A1B2C3D4E5`)
4. Save this for later

**Alternative**: In Xcode:
- Open `mobile/ios/guidr.xcworkspace`
- Select project → "guidr" target → "Signing & Capabilities"
- Look for "Team ID" in the top panel

### Step 2: Add iOS Entitlements

1. Open `mobile/ios/guidr/guidr.entitlements`
2. Add the Associated Domains entitlement:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- existing entitlements... -->

    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>webcredentials:guidr.madebysteven.nl</string>
    </array>
</dict>
</plist>
```

3. Rebuild the iOS app:
```bash
cd mobile
npm run ios
```

### Step 3: Create Apple App Site Association File

1. Create file: `.well-known/apple-app-site-association` (no .json extension!)

2. **Important**: Replace `TEAMID` with your actual Team ID from Step 1

```json
{
  "applinks": {},
  "webcredentials": {
    "apps": [
      "TEAMID.com.guidr"
    ]
  }
}
```

**Example** (replace `A1B2C3D4E5` with your actual Team ID):
```json
{
  "applinks": {},
  "webcredentials": {
    "apps": [
      "A1B2C3D4E5.com.guidr"
    ]
  }
}
```

### Step 4: Host AASA File

1. Upload the `apple-app-site-association` file to your server at:
   ```
   https://guidr.madebysteven.nl/.well-known/apple-app-site-association
   ```

2. **Requirements**:
   - Must be served over HTTPS
   - Content-Type header: `application/json`
   - No redirects (301/302 are NOT allowed)
   - File must be accessible without authentication
   - No query parameters

3. **Verify** the file is accessible:
   ```bash
   curl -I https://guidr.madebysteven.nl/.well-known/apple-app-site-association
   ```

   Should return: `200 OK` with `Content-Type: application/json`

4. **Verify** the content:
   ```bash
   curl https://guidr.madebysteven.nl/.well-known/apple-app-site-association
   ```

   Should display the JSON content with your Team ID

### Step 5: Clear iOS Cache

After the file is live:

1. On iOS device/simulator:
   - Settings → Passwords → "Password Options"
   - Delete saved autofill data (if present)
   - OR wait 24-48 hours for Apple's CDN to refresh

2. Reinstall the app with new entitlements:
   ```bash
   npm run ios
   ```

3. Test autofill:
   - Open Guidr login screen
   - Tap email field
   - Open 1Password
   - Should see "Guidr login" without verification warning

---

## Android Setup

### Step 1: Get SHA256 Fingerprint

Android requires the app's signing certificate fingerprint.

**For Debug Builds**:
```bash
keytool -list -v -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android
```

Look for: `SHA256: XX:XX:XX:...`

**For Production Builds**:
```bash
keytool -list -v -keystore /path/to/your/release.keystore \
  -alias your-alias-name
```

**Note**: Production keystore password and alias will differ. Check your build documentation.

### Step 2: Create Digital Asset Links File

1. Create file: `.well-known/assetlinks.json`

2. Copy the SHA256 fingerprint (WITHOUT colons for now - we'll format it):

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.guidr",
    "sha256_cert_fingerprints": [
      "XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX"
    ]
  }
}]
```

**Example**:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.guidr",
    "sha256_cert_fingerprints": [
      "AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78"
    ]
  }
}]
```

### Step 3: Host DAL File

1. Upload the `assetlinks.json` file to your server at:
   ```
   https://guidr.madebysteven.nl/.well-known/assetlinks.json
   ```

2. **Requirements**: Same as iOS
   - HTTPS only
   - Content-Type: `application/json`
   - No redirects
   - No authentication required

3. **Verify** the file:
   ```bash
   curl https://guidr.madebysteven.nl/.well-known/assetlinks.json
   ```

### Step 4: Update Android Manifest (Optional)

To enable full Android Auto-Verify, optionally add to `mobile/android/app/src/main/AndroidManifest.xml`:

```xml
<activity
  android:name=".MainActivity"
  ...
  android:exported="true">

  <!-- Existing LAUNCHER intent-filter -->
  <intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LAUNCHER" />
  </intent-filter>

  <!-- Add this for auto-verify -->
  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
      android:scheme="https"
      android:host="guidr.madebysteven.nl" />
  </intent-filter>
</activity>
```

### Step 5: Test Android

1. Rebuild and install the app:
   ```bash
   npm run android
   ```

2. Test autofill:
   - Open Guidr login screen
   - Tap email field
   - 1Password should show login entry without verification warning

3. (Optional) Verify auto-verify status:
   ```bash
   adb shell pm get-app-links com.guidr
   ```

---

## Server Configuration Examples

### Nginx Configuration

```nginx
# In your server block for guidr.madebysteven.nl
location /.well-known/ {
    alias /var/www/guidr/.well-known/;

    # Ensure proper content types
    types {
        application/json  json;
    }
    default_type application/json;

    # Allow access from anywhere
    add_header Access-Control-Allow-Origin "*";

    # Disable caching to ensure latest version
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
```

### Apache Configuration

```apache
<Directory /var/www/guidr/.well-known>
    <FilesMatch "\.(json)$">
        Header set Content-Type "application/json"
        Header set Access-Control-Allow-Origin "*"
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </FilesMatch>
</Directory>
```

---

## Troubleshooting

### iOS Issues

**Problem**: 1Password still shows "can't verify" message

**Solutions**:
1. Verify Team ID is correct (check Xcode again)
2. Verify AASA file is accessible:
   ```bash
   curl -v https://guidr.madebysteven.nl/.well-known/apple-app-site-association
   ```
3. Check Content-Type header in response (should be `application/json`)
4. Ensure no redirects:
   ```bash
   curl -I -L https://guidr.madebysteven.nl/.well-known/apple-app-site-association
   ```
   Should have only one `200 OK` response
5. Clear app data and reinstall:
   ```bash
   npm run ios
   # In simulator: Cmd+R to reload
   ```
6. Wait 24-48 hours for Apple's CDN to cache the file
7. Check iOS logs:
   - Settings → Developer → Universal Links Testing
   - Look for association diagnostics

**Problem**: App crashes on iOS with entitlements error

**Solution**:
1. Make sure Team ID is correct (no extra characters)
2. Make sure domain in entitlements matches exactly: `guidr.madebysteven.nl`
3. Rebuild from clean state:
   ```bash
   rm -rf mobile/ios/Pods mobile/ios/Podfile.lock
   npm run ios
   ```

### Android Issues

**Problem**: 1Password doesn't show autofill suggestion

**Solutions**:
1. Verify package name is correct: `com.guidr`
2. Verify SHA256 fingerprint:
   - Make sure it's from the correct keystore (debug vs production)
   - Check for uppercase/lowercase (fingerprints are case-insensitive but API expects uppercase)
3. Verify assetlinks.json is valid JSON:
   ```bash
   curl https://guidr.madebysteven.nl/.well-known/assetlinks.json | jq .
   ```
4. Check Content-Type header:
   ```bash
   curl -I https://guidr.madebysteven.nl/.well-known/assetlinks.json
   ```
5. Clear app data:
   ```bash
   adb shell pm clear com.guidr
   npm run android
   ```
6. Test auto-verify status:
   ```bash
   adb shell pm get-app-links com.guidr
   ```

**Problem**: Fingerprint doesn't match

**Solution**:
Make sure you're using the correct keystore:
- **Debug**: `~/.android/debug.keystore` (default password: `android`)
- **Release**: Your release keystore (custom password)

To verify which fingerprint is in your APK:
```bash
# Extract certificate from APK
unzip -p guidr.apk META-INF/CERT.RSA | keytool -printcert
```

---

## Testing & Verification

### Pre-Deployment Checklist

- [ ] AASA file created (no .json extension)
- [ ] assetlinks.json file created
- [ ] Both files in `.well-known/` directory
- [ ] Files served over HTTPS
- [ ] Content-Type headers correct
- [ ] No redirects (test with `curl -I`)
- [ ] No authentication required
- [ ] iOS entitlements added
- [ ] Team ID verified
- [ ] Android SHA256 fingerprint verified
- [ ] App rebuilt with new configuration

### Testing Steps

1. **iOS Device/Simulator**:
   ```bash
   npm run ios
   ```
   - Open Guidr login screen
   - Tap email field
   - Open 1Password app
   - Search for "Guidr"
   - Verify no "can't verify" warning appears
   - Tap suggestion to autofill

2. **Android Device/Emulator**:
   ```bash
   npm run android
   ```
   - Open Guidr login screen
   - Tap email field
   - 1Password autofill popup should appear
   - Tap to autofill

3. **Server Verification**:
   ```bash
   # Both should return 200 OK with application/json content-type
   curl -I https://guidr.madebysteven.nl/.well-known/apple-app-site-association
   curl -I https://guidr.madebysteven.nl/.well-known/assetlinks.json

   # Content should be valid JSON
   curl https://guidr.madebysteven.nl/.well-known/apple-app-site-association | jq .
   curl https://guidr.madebysteven.nl/.well-known/assetlinks.json | jq .
   ```

---

## Implementation Timeline

- **Phase 1** ✅ (Completed):
  - Keyboard handling fixed
  - Return key navigation implemented
  - All tests passing

- **Phase 2** (This guide):
  - Server configuration (1-2 hours)
  - iOS setup (30 minutes)
  - Android setup (30 minutes)
  - Testing & verification (1 hour)
  - **Total**: ~3 hours

---

## References

- [Apple App Site Association Documentation](https://developer.apple.com/documentation/xcode/supporting-associated-domains)
- [Android Digital Asset Links](https://developers.google.com/digital-asset-links)
- [1Password Autofill Support](https://support.1password.com/autofill/)
- [iOS Password AutoFill](https://developer.apple.com/documentation/security/keychain/autofill)

---

## Support

If issues persist after following this guide:

1. Double-check all file paths and domains
2. Verify server is serving files correctly
3. Clear all caches (browser, app, device)
4. Wait 24-48 hours for CDN propagation
5. Contact Apple/Google support if needed

For Guidr-specific issues, refer to the main CLAUDE.md documentation.
