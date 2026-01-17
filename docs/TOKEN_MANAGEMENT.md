# Token Management and Revocation

## Overview

This document describes the token lifecycle management for CyberDocGen, including session tokens, CSRF tokens, MFA tokens, and API keys.

---

## Token Types

| Token Type | Lifetime | Storage | Revocation |
|------------|----------|---------|------------|
| Session Token | 24 hours | Server-side (PostgreSQL) | Explicit logout or admin revoke |
| CSRF Token | Session-bound | Cookie + Session | On logout |
| MFA TOTP | 30 seconds | Generated on-demand | N/A (time-based) |
| MFA Backup Codes | One-time use | Database (hashed) | On use or regeneration |
| API Keys (if used) | No expiry | Database (hashed) | Manual revocation |

---

## Session Token Lifecycle

### Creation
1. User authenticates via Replit OAuth or enterprise login
2. Server generates cryptographically random session ID
3. Session stored in database with user ID, created timestamp, IP, user agent
4. Session cookie set with `httpOnly`, `secure`, `sameSite=strict`

### Validation
1. On each request, session ID extracted from cookie
2. Session looked up in database
3. Session validity checked:
   - Not expired (24h TTL)
   - Not revoked
   - IP/user agent match (optional, configurable)
4. Session risk score calculated for sensitive operations

### Rotation
- Session ID rotated after privilege escalation (MFA verification, role change)
- Session extended on activity (sliding window)

### Revocation
- **Explicit logout**: Session deleted from database
- **Admin revoke**: Admin can invalidate all sessions for a user
- **Security event**: Sessions invalidated on password change or security alert

```typescript
// Session revocation endpoint
POST /api/auth/logout
// Revokes current session

POST /api/admin/users/:userId/revoke-sessions
// Admin: Revokes all sessions for a user
```

---

## CSRF Token Management

### Creation
- Generated per session using `crypto.randomBytes(32)`
- Stored in session object and set as cookie

### Validation
- Triple validation: session token, cookie token, header token
- All three must match using timing-safe comparison
- Required for all state-changing requests (POST, PUT, PATCH, DELETE)

### Revocation
- CSRF token automatically invalidated when session ends
- No separate revocation needed

---

## MFA Token Management

### TOTP Tokens
- 6-digit codes generated using HMAC-SHA1
- 30-second validity window with ±1 step tolerance
- Rate limited to prevent brute force

### Backup Codes
- 10 one-time codes generated on MFA setup
- Stored as bcrypt hashes in database
- Each code can only be used once
- User can regenerate codes (invalidates all previous)

```typescript
// Regenerate backup codes
POST /api/auth/mfa/regenerate-backup-codes

// Returns new codes, invalidates old ones
```

---

## API Key Management (If Implemented)

### Creation
- Generated using `crypto.randomBytes(32)`
- Hashed before storage (bcrypt)
- Prefix for identification (e.g., `cdg_live_...`)

### Scopes
- Keys can have limited scopes (read-only, specific endpoints)
- Organization-bound

### Revocation
```typescript
// List API keys
GET /api/settings/api-keys

// Revoke specific key
DELETE /api/settings/api-keys/:keyId

// Revoke all keys
DELETE /api/settings/api-keys
```

---

## Session Security Features

### Risk Scoring
Sessions are assigned risk scores based on:
- Geographic location change
- Device fingerprint change
- Unusual access patterns
- Time-based anomalies

High-risk sessions may require:
- Re-authentication
- Step-up MFA
- Additional verification

### Concurrent Session Handling
- Users can have up to 5 concurrent sessions
- Oldest session auto-revoked when limit exceeded
- Active sessions list available in settings

---

## Audit Logging

All token operations are logged:
- Session creation/revocation
- MFA verification attempts
- API key creation/revocation
- Forced session termination

Logs include:
- Timestamp
- User ID
- IP address
- User agent
- Action result

---

## Security Recommendations

1. **Regular Session Cleanup**: Cron job removes expired sessions
2. **IP Binding**: Optional strict IP binding for sensitive operations
3. **Device Trust**: Remember trusted devices for reduced MFA friction
4. **Audit Review**: Regular review of session patterns for anomalies

---

**Document Owner**: Security Team  
**Last Updated**: January 2026  
**Review Schedule**: Quarterly
