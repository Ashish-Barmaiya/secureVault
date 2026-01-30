# SecureVault API Overview

This document describes the key API flows in SecureVault. Actual endpoint paths are indicative; refer to route definitions for exact paths.

---

## 1. Authentication Flows

### 1.1 User Registration

```
POST /auth/register
{
  "email": "user@example.com",
  "password": "strong-password"
}

Response:
{
  "success": true,
  "message": "User registered",
  "userId": "uuid"
}
```

### 1.2 User Login

```
POST /auth/login
{
  "email": "user@example.com",
  "password": "password"
}

Response (if 2FA not enabled):
{
  "success": true,
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "user": { ... }
}

Response (if 2FA enabled):
{
  "success": true,
  "requires2FA": true,
  "tempToken": "jwt"
}
```

### 1.3 2FA Verification

```
POST /auth/verify-2fa
{
  "tempToken": "jwt",
  "code": "123456"
}

Response:
{
  "success": true,
  "accessToken": "jwt",
  "refreshToken": "jwt"
}
```

---

## 2. Vault Unlock Flow

This is the core liveness proof flow.

### 2.1 Step 1: Request Challenge

```
GET /vault/challenge
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "challengeId": "uuid",
  "challenge": "64-char-hex-string",
  "unlockCounter": 5
}
```

- Challenge is 256-bit random (32 bytes hex)
- Expires in 5 minutes
- Counter is current vault unlock count

### 2.2 Step 2: Unlock Vault (Get Encrypted Key)

```
POST /vault/unlock
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "vault": {
    "encryptedVaultKey": "iv:ciphertext",
    "salt": "base64-salt"
  }
}
```

- Server decrypts its encryption layer
- Returns client-encrypted vault key and salt
- Client uses salt + password → PBKDF2 → Master Key
- Client decrypts vault key

### 2.3 Step 3: Submit Attestation

```
POST /vault/challenge/submit
Authorization: Bearer <accessToken>
{
  "challengeId": "uuid",
  "unlockCounter": 5,
  "attestation": {
    "ciphertext": "base64",
    "iv": "base64"
  }
}

Response:
{
  "success": true,
  "message": "Liveness proof submitted successfully",
  "vaultState": "ACTIVE",
  "lastUnlock": "2024-01-30T12:00:00Z"
}
```

**Server validates**:
- Challenge exists, not used, not expired
- Challenge belongs to this user
- Counter matches current vault counter

**Server updates**:
- Increment `vaultUnlockCounter`
- Reset `missedIntervals` to 0
- Set state to `ACTIVE`
- Record `lastSuccessfulUnlockAt`

### 2.4 Report Failure (Optional)

```
POST /vault/challenge/failure
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "failureCount": 3
}

Or (if rate limited):
{
  "success": false,
  "message": "Too many failed attempts",
  "cooldownUntil": "2024-01-30T12:15:00Z"
}
```

---

## 3. Vault Creation Flow

### 3.1 Create Vault

```
POST /vault/create
Authorization: Bearer <accessToken>
{
  "encryptedVaultKey": "iv:ciphertext",
  "encryptedRecoveryKey": "iv:ciphertext",
  "salt": "base64-salt",
  "encryptedVaultKeyByHeir": "{\"heirId\":\"rsa-encrypted-base64\"}"
}

Response:
{
  "success": true,
  "message": "Vault created successfully"
}
```

**Preconditions**:
- User has 2FA enabled
- User has at least one verified, linked heir

---

## 4. Asset Management

### 4.1 Create Asset

```
POST /vault/asset
Authorization: Bearer <accessToken>
{
  "vaultId": "uuid",
  "type": "SECRET_NOTE",
  "encryptedPayload": "{\"ciphertext\":\"...\",\"iv\":\"...\"}"
}

Response:
{
  "success": true,
  "asset": { "id": "uuid", ... }
}
```

### 4.2 Get Assets

```
GET /vault/assets
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "assets": [
    {
      "id": "uuid",
      "type": "CRYPTO_WALLET",
      "encryptedPayload": "{...}"
    }
  ]
}
```

Client decrypts each `encryptedPayload` with Vault Key.

---

## 5. Heir Linking Flow

### 5.1 User Invites Heir

```
POST /heir/invite
Authorization: Bearer <accessToken>
{
  "name": "Jane Doe",
  "email": "heir@example.com",
  "relationship": "Spouse"
}

Response:
{
  "success": true,
  "message": "OTP sent to heir email"
}
```

### 5.2 Verify Heir Email

```
POST /heir/verify
Authorization: Bearer <accessToken>
{
  "otp": "123456"
}

Response:
{
  "success": true,
  "heir": { "id": "uuid", ... }
}
```

### 5.3 Heir Registers and Sets Up Keys

```
POST /heir/auth/register
{
  "email": "heir@example.com",
  "password": "heir-password"
}

POST /heir/keys
Authorization: Bearer <heirAccessToken>
{
  "publicKey": "base64-spki",
  "encryptedPrivateKey": "iv:ciphertext",
  "salt": "base64"
}
```

### 5.4 Heir Accepts Link

```
POST /heir/link/respond
Authorization: Bearer <heirAccessToken>
{
  "accept": true
}

Response:
{
  "success": true,
  "message": "Request accepted. You are now linked."
}
```

### 5.5 User Updates Vault with Heir's Key

After heir is linked, user's client:
1. Fetches heir's public key
2. Encrypts Vault Key with RSA
3. Updates vault

```
POST /vault/update
Authorization: Bearer <accessToken>
{
  "encryptedVaultKeyByHeir": "{\"heirId\":\"rsa-encrypted-base64\"}"
}
```

---

## 6. Heir Claim Flow

### 6.1 Initiate Claim

```
POST /heir/vault/initiate
Authorization: Bearer <heirAccessToken>

Response:
{
  "success": true,
  "encryptedVaultKeyForHeir": "rsa-encrypted-base64",
  "encryptedPrivateKey": "iv:ciphertext",
  "salt": "base64",
  "challenge": "64-char-hex",
  "challengeId": "uuid"
}
```

**Preconditions**:
- `vault.state == INHERITABLE`
- Heir is verified and linked

### 6.2 Submit Claim

```
POST /heir/vault/claim
Authorization: Bearer <heirAccessToken>
{
  "challengeId": "uuid",
  "proof": {
    "ciphertext": "base64",
    "iv": "base64"
  }
}

Response:
{
  "success": true,
  "message": "Vault successfully claimed. You may now access assets."
}
```

**Server validates**:
- Challenge valid, not used, not expired
- Vault is INHERITABLE

**Server updates**:
- State → CLAIMED
- Record `claimedAt`

### 6.3 Access Assets

```
GET /heir/vault/assets
Authorization: Bearer <heirAccessToken>

Response:
{
  "success": true,
  "assets": [ ... ],
  "keys": {
    "salt": "base64",
    "encryptedPrivateKey": "iv:ciphertext",
    "encryptedVaultKeyForHeir": "rsa-encrypted-base64"
  }
}
```

Heir decrypts:
1. `encryptedPrivateKey` with Heir Master Key → RSA Private Key
2. `encryptedVaultKeyForHeir` with RSA Private Key → Vault Key
3. Each asset with Vault Key

---

## 7. State Transitions

### 7.1 Liveness Status

```
GET /vault/liveness
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "liveness": {
    "state": "ACTIVE",
    "lastSuccessfulUnlockAt": "2024-01-30T12:00:00Z",
    "missedIntervals": 0,
    "graceStartedAt": null,
    "nextCheckDate": "2024-03-01T12:00:00Z",
    "inactivityPeriod": 30
  }
}
```

### 7.2 State Transition (Cron)

Not API-triggered. Cron job runs daily:

```javascript
// Simplified logic
if (missedIntervals >= 3 && state === "ACTIVE") {
  state = "GRACE";
}
if (daysSinceGrace >= 30 && state === "GRACE") {
  state = "INHERITABLE";
}
```

---

## 8. Rate Limiting

| Endpoint | Rate Limit |
|----------|------------|
| `/vault/unlock` | 5 failures → 15 min cooldown |
| Most endpoints | Per-user; implicit via auth |

Rate limiting is per-vault, not global. Implemented via `unlockFailureCount` and `lastFailureAt` in vault record.

---

## 9. Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Bad request (missing fields, invalid data) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (vault state doesn't allow, not linked heir, etc.) |
| 404 | Resource not found |
| 429 | Rate limited |
| 500 | Internal server error |

Example error:
```json
{
  "success": false,
  "message": "Vault is not in an inheritable state."
}
```

---

## 10. Summary of Key Endpoints

| Flow | Endpoints |
|------|-----------|
| Auth | `/auth/register`, `/auth/login`, `/auth/verify-2fa` |
| Vault | `/vault/create`, `/vault/unlock`, `/vault/liveness` |
| Challenge | `/vault/challenge`, `/vault/challenge/submit`, `/vault/challenge/failure` |
| Assets | `/vault/asset`, `/vault/assets` |
| Heir Setup | `/heir/invite`, `/heir/verify`, `/heir/keys`, `/heir/link/respond` |
| Heir Claim | `/heir/vault/initiate`, `/heir/vault/claim`, `/heir/vault/assets` |
