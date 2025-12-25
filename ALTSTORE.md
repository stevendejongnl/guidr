# AltStore Distribution

Guidr can be installed via AltStore without needing the App Store or a paid Apple Developer account.

## For Users: Install Guidr via AltStore

### Option 1: Add Source (Recommended)

1. Open AltStore on your device
2. Go to **Browse** → **Sources** → **+**
3. Add this URL:
   ```
   https://raw.githubusercontent.com/stevendejongnl/guidr/main/altstore-source.json
   ```
4. Find **Guidr** in your sources and tap **Install**

### Option 2: Manual Sideload

1. Download the latest `guidr-unsigned.ipa` from [Releases](https://github.com/stevendejongnl/guidr/releases)
2. Open AltStore
3. Tap **My Apps** → **+**
4. Select the downloaded .ipa file

## For Developers: Creating Releases

### Automatic Release (Tag Push)

```bash
git tag v1.0.0
git push origin v1.0.0
```

This automatically:
- Builds unsigned IPA for device
- Creates GitHub Release
- Updates AltStore source JSON
- Makes app available via AltStore

### Manual Release (Workflow Dispatch)

1. Go to: https://github.com/stevendejongnl/guidr/actions/workflows/release-ios.yml
2. Click **Run workflow**
3. Enter version number (e.g., `1.0.0`)
4. Click **Run workflow**

## How It Works

### Unsigned IPA

The IPA is built **unsigned** (no Apple Developer account needed). When users install via AltStore:
- AltStore signs it with their personal Apple ID (free)
- App expires after 7 days (free account) or 1 year (paid)
- AltStore auto-refreshes apps before expiry

### AltStore Source

The `altstore-source.json` file contains:
- App metadata (name, description, icons)
- Version history
- Download URLs for each version
- Permissions and requirements

This file is hosted in the repo and referenced by AltStore.

## Assets Required

Create these assets in `.github/assets/`:

- **icon.png** - Source icon (200x200px)
- **header.png** - Source header banner (800x200px)
- **app-icon.png** - App icon (1024x1024px)

If these don't exist, AltStore will show placeholder images.

## Distribution Methods

| Method | Cost | Expiry | Auto-Refresh |
|--------|------|--------|--------------|
| Free Apple ID + AltStore | Free | 7 days | Yes (via AltStore) |
| Paid Apple Developer + AltStore | $99/year | 1 year | Yes (via AltStore) |
| AltStore PAL (EU only) | $99/year + fees | No expiry | N/A |

For most users, **free Apple ID with AltStore** is sufficient.

## Limitations

- **Free accounts**: Apps must be refreshed every 7 days (AltStore does this automatically)
- **Device limit**: Free accounts can install on up to 3 devices
- **Active apps**: Free accounts can have up to 3 apps installed at once

## Troubleshooting

### "Unable to install"
- Ensure you're signed in to AltStore with your Apple ID
- Check that you haven't exceeded the 3-app limit (free accounts)

### "App expired"
- Open AltStore and let it refresh the app
- AltStore auto-refreshes apps in the background when on WiFi

### "Untrusted Developer"
- Go to Settings → General → VPN & Device Management
- Tap your Apple ID under "Developer App"
- Tap "Trust"

## Security Note

This IPA is **unsigned** and built by GitHub Actions. Users should:
- Verify the source code on GitHub before installing
- Check the workflow logs to see what's built
- Only install from the official repository

AltStore signs the IPA with the user's own Apple ID during installation, so each installation has a unique signature.
