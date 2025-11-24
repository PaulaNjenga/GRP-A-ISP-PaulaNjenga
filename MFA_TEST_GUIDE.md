# MFA Testing Guide

## Issues Fixed

1. **Response Format Mismatch**: Backend was returning data at root level, frontend expected it wrapped in `data` object
2. **Missing MFA Verification Flag**: Added `mfaVerified` field to user responses
3. **Middleware Bypass Routes**: Added logout, MFA setup/verify to bypass routes
4. **Token Generation**: Fixed token generation to include MFA status

## Test Steps

### 1. Test Normal Login (No MFA)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "test123456"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "Test User",
      "email": "test@test.com",
      "role": "user",
      "mfaEnabled": false,
      "mfaVerified": true
    }
  }
}
```

### 2. Test MFA Setup
```bash
curl -X POST http://localhost:5000/api/auth/mfa/setup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,...",
    "secret": "BASE32_SECRET",
    "qrCodeUrl": "otpauth://totp/..."
  }
}
```

### 3. Test MFA Login Flow
```bash
# First login attempt (should require MFA)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "mfa_user@test.com", "password": "password123"}'
```

Expected response:
```json
{
  "success": true,
  "mfaRequired": true,
  "tempToken": "temp_jwt_token",
  "message": "MFA verification required"
}
```

### 4. Test MFA Verification
```bash
curl -X POST http://localhost:5000/api/auth/mfa/verify \
  -H "Authorization: Bearer TEMP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "123456"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "token": "full_access_jwt_token",
    "user": {
      "id": "user_id",
      "name": "MFA User",
      "email": "mfa_user@test.com",
      "role": "user",
      "mfaEnabled": true,
      "mfaVerified": true
    }
  }
}
```

## Frontend Testing

1. Open the login page
2. Use test credentials: `test@test.com` / `test123456`
3. Should login directly (no MFA)
4. Go to Settings and enable MFA
5. Logout and login again
6. Should show MFA prompt
7. Enter 6-digit code from authenticator app
8. Should redirect to dashboard

## Key Changes Made

### Backend (`authController.js`)
- Fixed login response format to wrap data in `data` object
- Fixed verifyMFA response format
- Fixed setupMFA response format
- Added `mfaVerified` field to all user responses

### Backend (`auth.js` middleware)
- Added MFA bypass routes: `/api/auth/logout`, `/api/auth/mfa/setup`, `/api/auth/mfa/verify`
- Enhanced MFA verification logic in protect middleware
- Fixed token generation to include MFA status

### Frontend (`AuthContext.jsx`)
- Updated verifyMFA to handle new response format
- Added proper error handling and logging
- Fixed data extraction from response

## Common Issues

1. **403 on logout**: Fixed by adding logout to bypass routes
2. **MFA not enforced**: Fixed by proper token generation with MFA flags
3. **Response format errors**: Fixed by standardizing all auth responses
4. **Frontend not showing MFA prompt**: Fixed by proper response handling

## Next Steps

1. Test with real authenticator app (Google Authenticator, Authy, etc.)
2. Add backup codes functionality
3. Add MFA disable functionality
4. Add rate limiting for MFA attempts
