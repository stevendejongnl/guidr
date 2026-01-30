# Deployment Guide: Guide Ownership & Visibility Control (Phase 8)

This guide covers deploying the guide ownership, visibility control, and category admin-only management features.

## Pre-Deployment Verification

### Backend

- [ ] All 390 backend tests passing
  ```bash
  npm run api:test
  ```
- [ ] All linting checks passing
  ```bash
  npm run api:lint
  ```
- [ ] All type checks passing
  ```bash
  npm run api:typecheck
  ```
- [ ] API documentation updated at `/api/docs`
- [ ] Migration script tested in dry-run mode

### Mobile

- [ ] All 1092 mobile tests passing
  ```bash
  npm run mobile:test
  ```
- [ ] All linting checks passing
  ```bash
  npm run mobile:lint
  ```
- [ ] All type checks passing
  ```bash
  npm run mobile:typecheck
  ```
- [ ] Android build successful
  ```bash
  npm run mobile:android
  ```
- [ ] iOS build successful
  ```bash
  npm run mobile:ios
  ```

### Integration

- [ ] Full test suite passing
  ```bash
  npm run test
  ```
- [ ] No security vulnerabilities
  ```bash
  npm run security:all
  ```

## Deployment Steps

### Phase 1: Backend Deployment (Production)

#### 1. Build and Push Docker Image

```bash
cd api-server

# Build Docker image
docker build -t ghcr.io/stevendejongnl/guidr-api-server:v1.43.0 .

# Push to registry
docker push ghcr.io/stevendejongnl/guidr-api-server:v1.43.0

# Update latest tag
docker tag ghcr.io/stevendejongnl/guidr-api-server:v1.43.0 ghcr.io/stevendejongnl/guidr-api-server:latest
docker push ghcr.io/stevendejongnl/guidr-api-server:latest
```

#### 2. Deploy API Server

```bash
# Using docker-compose (if applicable)
docker-compose up -d guidr-api-server

# Or kubernetes/cloud deployment
# Update deployment with new image version
```

- [ ] API is healthy at `https://guidr.madebysteven.nl/api/health`
- [ ] API documentation available at `https://guidr.madebysteven.nl/api/docs`
- [ ] All endpoints responding correctly

### Phase 2: Database Migration

#### 1. Prepare Migration

```bash
cd api-server

# Test migration in dry-run mode
uv run python scripts/migrate_guides_add_ownership.py --dry-run
```

This should show:
- Number of guides to migrate
- Sample guides being migrated
- No actual changes made

#### 2. Execute Migration

```bash
# Run actual migration
uv run python scripts/migrate_guides_add_ownership.py --apply
```

When prompted:
```
⚠ This will modify the database. Continue? (yes/no): yes
```

Expected output:
```
Migration completed:
  Modified: X
  Matched: X
  Upserted: None

✓ All guides successfully migrated!
```

#### 3. Verify Migration

```bash
# Check migration success via API
curl -H "Authorization: Bearer <admin-token>" \
  https://guidr.madebysteven.nl/api/guides

# Verify all guides have new fields
# - createdByUserId (null for legacy guides)
# - isPublic (false for legacy guides)
# - isHighlighted (false for legacy guides)
```

- [ ] All guides have createdByUserId field (null or user ID)
- [ ] All guides have isPublic field (boolean)
- [ ] All guides have isHighlighted field (boolean)
- [ ] All existing guides remain functional

### Phase 3: Mobile Deployment

#### 1. Build Android APK

```bash
cd mobile

# Build release APK
npm run mobile:android -- --release

# APK available at: android/app/build/outputs/apk/release/app-release.apk
```

#### 2. Build iOS App

```bash
cd mobile

# Build for TestFlight
npm run mobile:ios -- --configuration Release

# Upload to TestFlight via Xcode or Application Loader
```

#### 3. Release to App Stores

**Android (Google Play):**
- [ ] Upload APK to Google Play Console
- [ ] Update release notes with new features
- [ ] Set target audience
- [ ] Review content ratings
- [ ] Roll out (staged: 10% → 50% → 100%)

**iOS (TestFlight/App Store):**
- [ ] Upload via Xcode or Application Loader
- [ ] Add internal testers
- [ ] Monitor TestFlight feedback for 24-48 hours
- [ ] Submit to App Store Review
- [ ] Wait for approval (typically 24-48 hours)
- [ ] Release when approved

## Post-Deployment Verification

### API Endpoint Tests

```bash
# Test with API client (curl, Postman, or Insomnia)

# 1. Create a guide (auto-private)
POST /api/guides
{
  "categoryId": "cat-1",
  "title": "Test Guide",
  "description": "Testing new features"
}
# Expected: { ..., isPublic: false, isHighlighted: false, createdByUserId: "user-id" }

# 2. Make guide public
PATCH /api/guides/{guide-id}
{ "isPublic": true }
# Expected: { ..., isPublic: true }

# 3. Admin highlight guide
PATCH /api/guides/{guide-id}/highlight
{ "isHighlighted": true }
# Expected: { ..., isHighlighted: true }

# 4. Get my guides
GET /api/guides?my_guides=true
# Expected: Only guides created by current user

# 5. Get public guides
GET /api/guides?public=true
# Expected: Only guides with isPublic=true

# 6. Get highlighted guides
GET /api/guides?highlighted=true
# Expected: Only guides with isHighlighted=true and isPublic=true

# 7. Verify ownership authorization
GET /api/guides/{private-guide-id}
# Expected: 200 if owner or admin, 404 otherwise

# 8. Verify category admin-only
POST /api/categories
{ "name": "Test Category", "description": "Test" }
# Expected: 403 if not admin
```

### Mobile App Tests

**iOS:**
- [ ] Launch app on iOS device/simulator
- [ ] Test category browsing (create/edit disabled for non-admins)
- [ ] Create a guide (should be private by default)
- [ ] Toggle guide visibility to public
- [ ] Admin account: Toggle highlight on public guide
- [ ] Verify "Featured Guides" section on home screen
- [ ] Verify "My Guides" filter shows only user's guides
- [ ] Verify "Public" filter shows only public guides
- [ ] Test pulling to refresh data

**Android:**
- [ ] Launch app on Android device/emulator
- [ ] Repeat iOS tests above
- [ ] Test back button navigation
- [ ] Verify memory management during data refresh

### Authorization Tests

```bash
# Test 1: User cannot edit others' private guides
1. User A creates private guide
2. User B tries to PATCH the guide
# Expected: 403 Forbidden

# Test 2: Owner can edit own guide
1. User A creates guide
2. User A PATCHes the guide
# Expected: 200 OK

# Test 3: Admin can edit any guide
1. User A creates private guide
2. Admin PATCHes the guide
# Expected: 200 OK

# Test 4: Non-admin cannot highlight guides
1. User A tries to PATCH /guides/{id}/highlight
# Expected: 403 Forbidden

# Test 5: Admin can highlight guides
1. Admin PATCHes /guides/{id}/highlight
# Expected: 200 OK
```

### Visibility Tests

```bash
# Test 1: Private guides hidden from list
1. User A creates private guide
2. User B requests /api/guides
# Expected: Guide not in list

# Test 2: Public guides visible in list
1. User A creates and makes public
2. User B requests /api/guides
# Expected: Guide in list

# Test 3: Highlighted guides shown on homepage
1. Admin highlights a public guide
2. User requests GET /api/guides?highlighted=true
# Expected: Guide appears in list

# Test 4: Private highlighted guides not on homepage
1. Admin highlights a private guide
2. User requests GET /api/guides?highlighted=true
# Expected: Guide not in list
```

## Rollback Plan

If critical issues are discovered post-deployment:

### Backend Rollback

```bash
# Revert to previous image
docker pull ghcr.io/stevendejongnl/guidr-api-server:v1.42.0
docker-compose up -d guidr-api-server

# Verify health
curl https://guidr.madebysteven.nl/api/health
```

### Database Rollback

```bash
# Remove new fields from guides
db.guides.updateMany(
  {},
  { $unset: {
    createdByUserId: "",
    isPublic: "",
    isHighlighted: ""
  }}
)

# Or restore from backup if available
```

### Mobile Rollback

- [ ] Android: Remove new version from Play Store, mark as incompatible
- [ ] iOS: Reject TestFlight version, keep previous version available

## Monitoring & Alerts

### Key Metrics to Monitor

- [ ] API error rate (target: < 0.1%)
- [ ] Guide creation rate (should remain stable)
- [ ] Database query performance (especially filtered queries)
- [ ] Mobile app crashes (target: < 0.01%)
- [ ] Authorization failures (should be minimal, alert on spikes)

### Logs to Watch

```bash
# Backend logs for authorization errors
# grep "403" /var/log/guidr-api-server/*.log

# Mobile crash reports
# Check Firebase Crashlytics or equivalent

# Database slow query logs
# Monitor MongoDB slow query logs for new query patterns
```

## Known Limitations & Workarounds

### Legacy Guides

Guides created before this deployment will have:
- `createdByUserId`: null
- `isPublic`: false (private by default)
- `isHighlighted`: false

**Workaround:** Admins can update these guides using the API to set proper ownership:
```bash
PATCH /api/guides/{guide-id}
{ "createdByUserId": "user-id" }
```

### Backward Compatibility

Old mobile versions (< 1.43.0) will:
- Not see visibility toggle UI
- See all guides (no filtering)
- Not be able to create public guides

**Recommendation:** In the app update, display a banner encouraging users to update.

## Success Criteria

- [ ] 0 test failures in full suite
- [ ] All 5 phases of authorization tests pass
- [ ] All 4 phases of visibility tests pass
- [ ] Database migration completed successfully
- [ ] Mobile apps released to all users
- [ ] No increase in error rates post-deployment
- [ ] User feedback positive for new features

## Timeline

| Phase | Timeline | Status |
|-------|----------|--------|
| Backend Deployment | T+0 | Pending |
| Database Migration | T+30 min | Pending |
| API Verification | T+1 hour | Pending |
| Mobile Release | T+2 hours (iOS TestFlight) / T+4 hours (Android) | Pending |
| Full Rollout | T+48 hours (after monitoring) | Pending |

## Contact & Support

- **Backend Issues**: Check API logs at `https://guidr.madebysteven.nl/api/docs`
- **Mobile Issues**: Check app crash reports and user feedback
- **Database Issues**: Contact database administrator
- **Emergency Rollback**: Follow rollback plan above

---

**Last Updated**: 2026-01-30
**Deployment Version**: 1.43.0
**Related ADRs**: [ADR-006](./adr/006-admin-user-authorization.md), [ADR-007](./adr/007-user-based-admin-mode-mobile.md)
