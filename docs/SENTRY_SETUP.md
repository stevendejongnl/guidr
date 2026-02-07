# Sentry Setup Documentation

This document explains how Sentry error tracking is configured across the Guidr project.

## Overview

Sentry is enabled **only in production environments**:
- **Mobile app**: Production APK releases (GitHub) and TestFlight builds
- **API server**: Production Kubernetes deployment
- **Local development**: Sentry is disabled to avoid noise

## Mobile App Configuration

### Environment Variables

The mobile app uses `react-native-dotenv` to load environment variables from a `.env` file.

**File**: `mobile/.env` (gitignored, created during CI/CD builds)

```bash
SENTRY_DSN=https://YOUR_DSN_HERE@o257363.ingest.us.sentry.io/4510629687394304
```

### Initialization Logic

**File**: `mobile/src/presentation/App.tsx`

```typescript
// Only initialize Sentry in production builds (not in tests or local development)
if (process.env['JEST_WORKER_ID'] === undefined && !__DEV__ && SENTRY_DSN) {
  Sentry.init({ dsn: SENTRY_DSN, ... })
}
```

**Conditions for Sentry initialization:**
- ✅ `process.env['JEST_WORKER_ID'] === undefined` - Not running Jest tests
- ✅ `!__DEV__` - Not in development mode (Metro bundler)
- ✅ `SENTRY_DSN` is set - Environment variable exists

**Result:**
- ❌ Local development (`npm start`) - Sentry disabled
- ❌ Jest tests - Sentry disabled
- ✅ Production APK (GitHub release) - Sentry enabled
- ✅ TestFlight builds - Sentry enabled

### Local Development

For local development, you can create a `mobile/.env` file (gitignored) if needed, but it won't be used because `__DEV__` is `true`.

```bash
cp mobile/.env.example mobile/.env
# Edit mobile/.env if needed (but Sentry won't initialize in __DEV__ mode)
```

## API Server Configuration

### Environment Variables

The API server reads Sentry configuration from environment variables (set in Kubernetes).

**File**: `api-server/.env.example` (reference only, not used in production)

```bash
# Sentry DSN (set this in Kubernetes secrets)
SENTRY_DSN=https://YOUR_DSN_HERE@o257363.ingest.us.sentry.io/4510629687394304

# Environment name (e.g., production, staging)
SENTRY_ENVIRONMENT=production
```

### Initialization Logic

**File**: `api-server/src/infrastructure/monitoring/sentry_config.py`

```python
def init_sentry() -> None:
    sentry_dsn = os.getenv("SENTRY_DSN")
    if not sentry_dsn:
        logger.info("Sentry disabled: SENTRY_DSN not configured")
        return
    # ... initialize Sentry
```

**Conditions for Sentry initialization:**
- ✅ `SENTRY_DSN` environment variable is set
- ❌ If not set, Sentry is disabled (local development)

**Result:**
- ❌ Local development - Sentry disabled (no `SENTRY_DSN` set)
- ❌ Docker local - Sentry disabled (no `SENTRY_DSN` set)
- ✅ Kubernetes production - Sentry enabled (via secrets)

### Performance Monitoring

The API server includes performance monitoring with sampling:
- **Traces sampling**: 10% of transactions (adjustable via `traces_sample_rate`)
- **Profiles sampling**: 10% of sampled transactions
- **FastAPI integration**: Automatic endpoint tracking
- **Logging integration**: ERROR level logs sent as events

### Local Development

For local development, simply don't set the `SENTRY_DSN` environment variable.

```bash
# api-server/.env.local (optional, for local config)
# Leave SENTRY_DSN unset to disable Sentry
```

## GitHub Secrets Configuration

Add the following secret to your GitHub repository:

### Required Secret

**`MOBILE_SENTRY_DSN`** - Sentry DSN for the mobile app
- Navigate to: Repository → Settings → Secrets and variables → Actions
- Click "New repository secret"
- Name: `MOBILE_SENTRY_DSN`
- Value: `https://46265225d779c5a032c1bcf0dd9bb468@o257363.ingest.us.sentry.io/4510629687394304`

### Existing Secrets (Already configured)

- `SENTRY_AUTH_TOKEN` - Used for uploading debug symbols/source maps

## Kubernetes Configuration

### Deployment ConfigMap/Secret

Add the Sentry DSN to your Kubernetes deployment configuration:

**Option 1: Using Kubernetes Secret (Recommended)**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: guidr-api-secrets
  namespace: guidr
type: Opaque
stringData:
  SENTRY_DSN: "https://YOUR_DSN_HERE@o257363.ingest.us.sentry.io/4510629687394304"
  SENTRY_ENVIRONMENT: "production"
```

**Option 2: Using ConfigMap (Less secure, DSN is public key)**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: guidr-api-config
  namespace: guidr
data:
  SENTRY_DSN: "https://YOUR_DSN_HERE@o257363.ingest.us.sentry.io/4510629687394304"
  SENTRY_ENVIRONMENT: "production"
```

### Deployment Configuration

Reference the secret/configmap in your deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: guidr-api
  namespace: guidr
spec:
  template:
    spec:
      containers:
      - name: api
        image: ghcr.io/stevendejongnl/guidr-api-server:latest
        envFrom:
        - secretRef:
            name: guidr-api-secrets  # Load all keys from secret
        # OR individually:
        env:
        - name: SENTRY_DSN
          valueFrom:
            secretKeyRef:
              name: guidr-api-secrets
              key: SENTRY_DSN
        - name: SENTRY_ENVIRONMENT
          value: "production"
```

### Verification

To verify Sentry is enabled in Kubernetes:

```bash
# Check if environment variables are set
kubectl exec -n guidr deployment/guidr-api -- env | grep SENTRY

# Check logs for Sentry initialization
kubectl logs -n guidr deployment/guidr-api | grep -i sentry
# Should see: "Sentry initialized for environment: production"
```

## Getting Sentry DSN

1. Go to [Sentry.io](https://sentry.io/)
2. Navigate to: Settings → Projects → guidr → Client Keys (DSN)
3. Copy the DSN value

**Current Sentry Project:**
- Organization: `madebysteven`
- Project: `guidr`
- DSN: `https://46265225d779c5a032c1bcf0dd9bb468@o257363.ingest.us.sentry.io/4510629687394304`

## Testing Sentry Integration

### Mobile App

1. **Production APK**: Download from GitHub releases and trigger an error
2. **TestFlight**: Install TestFlight build and trigger an error
3. **Check Sentry**: Go to Sentry.io → Projects → guidr → Issues

### API Server

1. **Trigger test error**:
   ```bash
   curl -X POST https://api.guidr.madebysteven.nl/test-error
   ```

2. **Check logs**:
   ```bash
   kubectl logs -n guidr deployment/guidr-api | grep -i sentry
   ```

3. **Check Sentry**: Go to Sentry.io → Projects → guidr → Issues

## Troubleshooting

### Mobile app still sending events in development

**Problem**: Sentry events appearing from local development

**Solution**:
1. Verify `__DEV__` check in `App.tsx`
2. Clear Metro bundler cache: `npm start -- --reset-cache`
3. Rebuild app: `npm run android` or `npm run ios`

### API server not sending events in production

**Problem**: No Sentry events from Kubernetes

**Solution**:
1. Verify `SENTRY_DSN` is set: `kubectl exec -n guidr deployment/guidr-api -- env | grep SENTRY_DSN`
2. Check logs: `kubectl logs -n guidr deployment/guidr-api | grep -i sentry`
3. Should see: "Sentry initialized for environment: production"
4. If not initialized, check secret/configmap exists and is referenced correctly

### GitHub Actions build failing

**Problem**: Mobile builds failing after adding `.env` file creation

**Solution**:
1. Verify `MOBILE_SENTRY_DSN` secret exists in GitHub repository settings
2. Check workflow logs for `.env` file creation step
3. Ensure `react-native-dotenv` is installed: `npm list react-native-dotenv`

## Dependencies

### Mobile App
- `@sentry/react-native` - Sentry SDK for React Native
- `react-native-dotenv` - Environment variable support

### API Server
- `sentry-sdk[fastapi]` - Sentry SDK with FastAPI integration

## Related Files

### Mobile
- `mobile/.env.example` - Environment variable template
- `mobile/env.d.ts` - TypeScript definitions for `@env`
- `mobile/babel.config.js` - Babel plugin configuration
- `mobile/src/presentation/App.tsx` - Sentry initialization
- `.github/workflows/android-release.yml` - Android CI/CD with Sentry
- `.github/workflows/testflight-deploy.yml` - iOS CI/CD with Sentry

### API Server
- `api-server/.env.example` - Environment variable template
- `api-server/pyproject.toml` - Python dependencies
- `api-server/src/infrastructure/monitoring/sentry_config.py` - Sentry initialization
- `api-server/src/main.py` - Application entry point

## Summary

✅ **Mobile app**: Only sends to Sentry in production builds (APK/TestFlight)
✅ **API server**: Only sends to Sentry when `SENTRY_DSN` is set (Kubernetes)
✅ **Local development**: Sentry disabled for both mobile and API
✅ **CI/CD**: Automated `.env` creation with GitHub secrets
✅ **Kubernetes**: Manual configuration via secrets/configmap
