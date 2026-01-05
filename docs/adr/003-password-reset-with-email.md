# ADR-003: Password Reset with Email Delivery

## Status

Proposed

## Context

Users who forget their passwords currently have no self-service recovery mechanism. They must:
- Create a new account with a different email, or
- Contact support to manually reset their password

This creates a poor user experience and support burden. A "Forgot Password?" flow is a standard expectation for apps with email/password authentication.

However, password reset introduces complexity:
1. **Token generation**: Need unique, time-limited tokens that can't be guessed
2. **Token storage**: Must store tokens with expiration, securely
3. **Email delivery**: Requires SMTP configuration and email templates
4. **Security**: Prevent token reuse, timing attacks, and email enumeration
5. **Deep linking**: Frontend needs to handle password reset links (optional in MVP)

## Decision

We will implement a **two-step password reset flow** with time-limited tokens and email delivery:

### Step 1: Request Password Reset

**Endpoint**: `POST /api/v1/auth/request-password-reset`

**Flow**:
1. User submits email address
2. System looks up user by email
3. If user exists:
   - Generate UUID reset token
   - Store token in `password_reset_tokens` collection with 1-hour expiration
   - Send email with reset link: `guidr://reset-password?token=<token>`
4. Always return success message (prevents email enumeration)

**Response**: `{"message": "If email exists, reset instructions have been sent"}`

**Security**: Generic success message prevents attackers from determining if an email is registered.

### Step 2: Reset Password

**Endpoint**: `POST /api/v1/auth/reset-password`

**Flow**:
1. User submits reset token + new password
2. System validates token:
   - Exists in database
   - Not expired (created < 1 hour ago)
   - Not already used
3. If valid:
   - Look up user by token
   - Hash new password (Argon2)
   - Update user password
   - Delete/invalidate token
   - Emit `UserPasswordChanged` event
4. Return success

**Response**: `{"message": "Password reset successfully"}`

### Token Storage

**MongoDB Collection**: `password_reset_tokens`

```javascript
{
  _id: ObjectId,
  token: "uuid-v4-string",  // indexed, unique
  userId: "user-entity-id",
  createdAt: ISODate,
  expiresAt: ISODate,       // indexed for cleanup, TTL
  used: false               // prevents token reuse
}
```

**TTL Index**: MongoDB TTL index on `expiresAt` automatically deletes expired tokens.

### Email Service

**File**: `api-server/src/infrastructure/email/email_service.py` (NEW)

**SMTP Configuration** (environment variables):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@guidr.app
SMTP_PASSWORD=<app-password>
FROM_EMAIL=noreply@guidr.app
```

**Email Template** (`api-server/src/infrastructure/email/templates.py`):
```
Subject: Reset your Guidr password

Hi,

We received a request to reset your password. Click the link below to reset it:

[Reset Password](guidr://reset-password?token=<token>)

This link expires in 1 hour.

If you didn't request this, you can safely ignore this email.

Thanks,
The Guidr Team
```

### Frontend Integration (Optional in MVP)

**Option A**: Deep link handling
- App registers `guidr://` URL scheme
- Tapping email link opens ResetPasswordScreen with token
- User enters new password
- App calls `/auth/reset-password` endpoint

**Option B**: Placeholder (Simpler MVP)
- LoginScreen shows "Forgot Password? Contact support"
- Backend fully functional for future implementation
- Email sent but no UI to trigger it yet

**Decision**: Start with Option B, add Option A in future iteration.

## Consequences

### Positive

- **User autonomy**: Users can reset passwords without support intervention
- **Standard UX**: Familiar "Forgot Password?" flow reduces friction
- **Secure tokens**: UUID with 1-hour expiration prevents guessing and limits exposure
- **Email validation**: Confirms user owns the email address (implicit verification)
- **Audit trail**: `UserPasswordChanged` event tracks password resets
- **Automatic cleanup**: MongoDB TTL index removes expired tokens automatically
- **Prevent enumeration**: Generic success message doesn't leak registered emails

### Negative

- **SMTP dependency**: Requires email server configuration (Gmail, SendGrid, AWS SES)
  - **Risk**: Email delivery failures (SMTP down, credentials expired, rate limits)
  - **Mitigation**: Use reliable provider with monitoring and alerting
- **Email deliverability**: Emails may go to spam, get delayed, or bounce
  - **Mitigation**: Use proper DKIM/SPF/DMARC configuration, reputable sender domain
- **Token storage**: New MongoDB collection and cleanup logic required
- **Development time**: ~2 hours backend + 2 hours frontend (if full UI implemented)
- **Testing complexity**: Need to mock SMTP in tests to avoid sending real emails

### Security Considerations

✅ **Time-limited tokens**: 1-hour expiration limits window for token theft
✅ **Single-use tokens**: `used` flag prevents replay attacks
✅ **No email enumeration**: Always return success to prevent discovering registered emails
✅ **Token uniqueness**: UUID v4 provides 122 bits of entropy (not guessable)
✅ **Password hashing**: New password hashed with Argon2 before storage
⚠️ **Email in transit**: Email sent over SMTP (use TLS to encrypt)
⚠️ **Email at rest**: Reset token visible in user's email inbox (inherent risk)
⚠️ **No rate limiting**: User could spam password reset requests (add rate limiting separately)

### Operational Considerations

- **SMTP credentials**: Must be securely stored (environment variables, secrets manager)
- **Email monitoring**: Should track delivery failures and bounce rates
- **Token cleanup**: MongoDB TTL index requires `expiresAt` field and index creation
- **Testing**: Use test SMTP service (Mailtrap, MailHog) in development/staging

## Alternatives Considered

### 1. Magic Links (Passwordless Auth)
**Rejected**: Requires email for every login, doesn't support "forgot password" flow for existing password-based accounts. Could be added as alternative login method later.

### 2. SMS-Based Reset
**Rejected**: Requires phone number collection and SMS gateway (Twilio, etc.), higher cost, worse deliverability than email.

### 3. Security Questions
**Rejected**: Less secure (answers often guessable or searchable), poor UX, not recommended by modern security best practices.

### 4. Admin-Only Password Reset
**Rejected**: Poor UX, support burden, doesn't scale, prevents self-service.

### 5. JWT Tokens for Reset (No Database Storage)
**Considered**: Could use short-lived JWT tokens instead of database storage. Rejected because:
- Can't revoke tokens once issued (if user clicks "Reset" multiple times)
- Can't track if token was already used
- No audit trail of reset requests
- Database storage provides better control and auditability

## Implementation Notes

- **Email templates**: Keep text simple and clear, include expiration time
- **Token expiration**: 1 hour balances security (short window) and usability (enough time to check email)
- **Error messages**: Vague messages on failure ("Invalid or expired reset link") to prevent timing attacks
- **SMTP testing**: Use MailHog or Mailtrap in development to capture emails without sending
- **Rate limiting**: Consider adding rate limiting to prevent reset request spam (not in MVP)
- **Frontend UX**: If implementing UI, show "Check your email" success screen, handle token expiration gracefully

## Related Decisions

- [ADR-001: User Profile and Account Management System](./001-user-profile-and-account-management.md) - Part of comprehensive account management
- [ADR-002: JWT Authentication Middleware](./002-jwt-authentication-middleware.md) - Reset endpoint does not require authentication

## Date

2026-01-05
