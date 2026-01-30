# Quick Start: Phase 8 Deployment

One-page reference for deploying guide ownership & visibility control feature.

## Pre-Deployment (5 min)

```bash
# Verify all tests pass
npm run test                    # 1482 tests total
npm run api:test              # 390 backend tests
npm run mobile:test           # 1092 mobile tests

# Verify linting and types
npm run lint
npm run typecheck
npm run security:all
```

**Status Check**:
- ✅ 390 backend tests passing
- ✅ 1092 mobile tests passing (pre-existing 8 GuideFormScreen failures OK)
- ✅ Linting clean
- ✅ Type checks clean
- ✅ No security vulnerabilities

## Backend Deployment (10 min)

```bash
# Build Docker image
docker build -t ghcr.io/stevendejongnl/guidr-api-server:v1.43.0 \
  api-server/

# Push to registry
docker push ghcr.io/stevendejongnl/guidr-api-server:v1.43.0
docker tag ghcr.io/stevendejongnl/guidr-api-server:v1.43.0 \
  ghcr.io/stevendejongnl/guidr-api-server:latest
docker push ghcr.io/stevendejongnl/guidr-api-server:latest

# Deploy (example docker-compose)
docker-compose up -d guidr-api-server

# Verify health
curl https://guidr.madebysteven.nl/api/health
```

## Database Migration (5 min)

```bash
# DRY RUN - see what will change
cd api-server
uv run python scripts/migrate_guides_add_ownership.py --dry-run

# APPLY migration
uv run python scripts/migrate_guides_add_ownership.py --apply
# Answer: yes

# Verify
curl -H "Authorization: Bearer <token>" \
  https://guidr.madebysteven.nl/api/guides \
  | grep -E '"isPublic"|"isHighlighted"|"createdByUserId"'
```

**Expected Output**:
```
Migration completed:
  Modified: X
  Matched: X
  Upserted: None

✓ All guides successfully migrated!
```

## API Verification (5 min)

```bash
# Test create guide (private by default)
curl -X POST https://guidr.madebysteven.nl/api/guides \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "cat-1",
    "title": "Test Guide",
    "description": "Testing new features"
  }' | jq '.isPublic, .isHighlighted'
# Should output: false, false

# Test make public
curl -X PATCH https://guidr.madebysteven.nl/api/guides/{id} \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"isPublic": true}' | jq '.isPublic'
# Should output: true

# Test admin highlight (admin only)
curl -X PATCH https://guidr.madebysteven.nl/api/guides/{id}/highlight \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"isHighlighted": true}' | jq '.isHighlighted'
# Should output: true

# Test my guides filter
curl https://guidr.madebysteven.nl/api/guides?my_guides=true \
  -H "Authorization: Bearer <token>" | jq 'length'

# Test public guides filter
curl https://guidr.madebysteven.nl/api/guides?public=true \
  -H "Authorization: Bearer <token>" | jq 'length'

# Test highlighted guides (homepage)
curl https://guidr.madebysteven.nl/api/guides?highlighted=true \
  -H "Authorization: Bearer <token>" | jq 'length'
```

## Mobile Deployment (30 min)

```bash
# Android
cd mobile
npm run mobile:android -- --release
# Upload to Play Store Console
# Use staged rollout: 10% → 50% → 100%

# iOS
npm run mobile:ios -- --configuration Release
# Upload to TestFlight / App Store
# Wait for review (24-48 hours)
```

## Post-Deployment (10 min)

### Authorization Tests
```bash
# User cannot edit others' private guides → 403
# Owner can edit own guide → 200
# Admin can edit any guide → 200
# Non-admin cannot highlight → 403
# Admin can highlight → 200
```

### Visibility Tests
```bash
# Private guides hidden from others → 404
# Public guides visible to all → 200
# Highlighted guides on homepage → appears in list
# Legacy guides (no owner) → only admin can edit
```

### Mobile App Tests
- [ ] iOS: Category create disabled for non-admins
- [ ] Android: Category create disabled for non-admins
- [ ] iOS: Guide visibility toggle visible
- [ ] Android: Guide visibility toggle visible
- [ ] iOS: Guide filter tabs (All/My/Public)
- [ ] Android: Guide filter tabs (All/My/Public)
- [ ] iOS: Featured guides section on home
- [ ] Android: Featured guides section on home

## Rollback (2 min)

```bash
# Backend rollback
docker pull ghcr.io/stevendejongnl/guidr-api-server:v1.42.0
docker-compose up -d guidr-api-server

# Database rollback (if needed)
# Restore from backup OR remove new fields:
# db.guides.updateMany({}, {$unset: {
#   createdByUserId: "",
#   isPublic: "",
#   isHighlighted: ""
# }})

# Mobile rollback
# - Android: Remove new version from Play Store
# - iOS: Reject TestFlight version
```

## Success Checklist

- [ ] Backend tests: 390 passing ✅
- [ ] Mobile tests: 1092 passing ✅
- [ ] Migration: Guides updated ✅
- [ ] API health: OK ✅
- [ ] Authorization: Working ✅
- [ ] Visibility: Working ✅
- [ ] Mobile: Deployed ✅
- [ ] No error rate spike ✅

## Timeline

| Step | Time | Status |
|------|------|--------|
| Pre-deployment checks | T+0 | Pending |
| Backend deployment | T+5 | Pending |
| API verification | T+10 | Pending |
| Database migration | T+15 | Pending |
| Android release | T+20 | Pending |
| iOS TestFlight | T+25 | Pending |
| Monitoring | T+30 → T+48 hours | Pending |

**Total Time**: ~2 hours (plus 24-48 hours for app store reviews)

## Monitoring

```bash
# Watch API errors
tail -f /var/log/guidr-api-server/app.log | grep -E "ERROR|403|404"

# Check database performance
# Monitor slow query logs for new query patterns

# Mobile crash monitoring
# Check Firebase Crashlytics for new crashes
```

## Emergency Contact

- Backend issues: Check API logs
- Database issues: Contact DBA
- Mobile issues: Check app crash reports
- Emergency rollback: See Rollback section above

---

**Version**: 1.43.0
**Date**: 2026-01-30
**Full Docs**: See `docs/DEPLOYMENT.md` for detailed guidance
**Phase Summary**: See `docs/PHASE_8_SUMMARY.md` for complete overview
