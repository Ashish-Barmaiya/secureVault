# SecureVault Inheritance Model

This document describes how digital inheritance works in SecureVault, including the Dead Man's Switch mechanism, state transitions, and claim process.

---

## 1. Overview

SecureVault implements a **time-delayed inheritance** model. If the vault owner fails to demonstrate liveness (unlock their vault) for an extended period, the vault becomes claimable by a pre-designated heir.

Key properties:
- **Inactivity-triggered**: No external death verification required
- **Grace period**: User has time to recover before inheritance activates
- **One-way transition**: Once claimed, user access is permanently revoked
- **Read-only inheritance**: Heir can view but not modify assets

---

## 2. Inactivity Detection

### Liveness Proof

The user proves they are alive by successfully unlocking their vault. This involves:
1. Entering their Master Password
2. Decrypting the Vault Key
3. Generating a cryptographic attestation
4. Submitting the attestation to the server

The server records `lastSuccessfulUnlockAt` timestamp.

### Inactivity Period

Each user configures an `inactivityPeriod` (default: 30 days). This is the duration after which a missed check-in counts as a "lapse."

### Missed Intervals

The liveness cron job runs daily and calculates:

```
daysSinceUnlock = (now - lastSuccessfulUnlockAt) / days
missedIntervals = floor(daysSinceUnlock / inactivityPeriod)
```

**Example**: User sets 30-day period. Last unlock was 95 days ago.
- `missedIntervals = floor(95 / 30) = 3`

---

## 3. Vault State Machine

```
┌─────────────────────────────────────────────────────────────────────┐
│                          STATE DIAGRAM                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│         ┌───────────┐                                               │
│         │  ACTIVE   │◀─────────── Liveness proof submitted          │
│         └─────┬─────┘                     │                         │
│               │                           │                         │
│               │ 3+ missed intervals       │                         │
│               │ (cron detects)            │                         │
│               ▼                           │                         │
│         ┌───────────┐                     │                         │
│         │   GRACE   │─────────────────────┘                         │
│         └─────┬─────┘                                               │
│               │                                                     │
│               │ 30 days in GRACE without proof                      │
│               │ (cron transitions)                                  │
│               ▼                                                     │
│         ┌───────────┐                                               │
│         │INHERITABLE│                                               │
│         └─────┬─────┘                                               │
│               │                                                     │
│               │ Heir submits valid claim                            │
│               ▼                                                     │
│         ┌───────────┐                                               │
│         │  CLAIMED  │◀── TERMINAL (no transitions out)              │
│         └───────────┘                                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### State Definitions

| State | Description |
|-------|-------------|
| **ACTIVE** | User has recently proven liveness. Normal operation. |
| **GRACE** | User has missed ≥3 consecutive check-in intervals. Warning period. |
| **INHERITABLE** | Grace period expired. Heir may now claim the vault. |
| **CLAIMED** | Heir has claimed. User access permanently revoked. |

---

## 4. Grace Period

### Purpose

The grace period protects against false inheritance triggers (e.g., user traveling, hospitalized, forgot to check in). It provides a buffer before the vault becomes claimable.

### Duration

**30 days** (hardcoded in `liveness.service.js`)

### Behavior During Grace

- User can still unlock vault at any time
- Successful unlock resets state to ACTIVE
- `missedIntervals` resets to 0
- Heir cannot claim

### Notifications

| Event | User Notification | Heir Notification |
|-------|-------------------|-------------------|
| 1-2 missed intervals | Reminder email | None |
| Enter GRACE (3 intervals) | Urgent warning | Informational |
| Enter INHERITABLE | Final notice | Claim instructions |

*(Note: Email functionality is stubbed; notifications are TODO)*

---

## 5. Claiming Process

### Preconditions

1. Vault state is `INHERITABLE`
2. Heir is `isVerified: true` (completed key ceremony)
3. Heir is `linkStatus: LINKED`
4. Heir has valid 2FA session

### Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                       CLAIM FLOW                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Heir calls POST /heir/vault/initiate                            │
│     - Server verifies vault.state == INHERITABLE                    │
│     - Server returns:                                               │
│       • challenge (256-bit random)                                  │
│       • challengeId                                                 │
│       • encryptedVaultKeyForHeir (RSA-encrypted)                    │
│       • encryptedPrivateKey (heir's)                                │
│       • salt (heir's)                                               │
│                                                                     │
│  2. Heir enters Heir Master Password                                │
│     - Client derives Heir Master Key (PBKDF2)                       │
│     - Client decrypts Heir's RSA Private Key                        │
│                                                                     │
│  3. Client decrypts Vault Key                                       │
│     - RSA-OAEP decrypt with Heir's Private Key                      │
│                                                                     │
│  4. Client generates proof                                          │
│     - proof = AES-GCM(challenge || heirId, Vault Key)               │
│                                                                     │
│  5. Heir calls POST /heir/vault/claim                               │
│     - Server validates challenge (not expired, not used)            │
│     - Server stores proof as UnlockAttestation (audit)              │
│     - Server transitions vault.state → CLAIMED                      │
│     - Server records claimedAt timestamp                            │
│                                                                     │
│  6. Heir accesses assets                                            │
│     - GET /heir/vault/assets                                        │
│     - Returns encrypted assets                                      │
│     - Client decrypts with Vault Key                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Read-Only Enforcement

After claiming, the heir has **read-only access**:

| Operation | Allowed? |
|-----------|----------|
| Decrypt and view assets | ✅ Yes |
| Add new assets | ❌ No |
| Modify existing assets | ❌ No |
| Delete assets | ❌ No |
| Add/remove heirs | ❌ No |
| Change vault settings | ❌ No |

**Enforcement**:
- `POST /vault/asset` checks `req.user` is the vault owner, not an heir
- Heir endpoints (`/heir/vault/*`) only expose read operations
- Server does not provide write endpoints for heirs

---

## 7. User Access Revocation

Once the vault is `CLAIMED`:

1. **Unlock endpoint rejects user**:
   ```javascript
   if (vault.state === "INHERITABLE" || vault.state === "CLAIMED") {
     return res.status(403).json({
       message: "Vault is no longer accessible. It has been transferred to your heir."
     });
   }
   ```

2. **State transition validation**:
   - `CLAIMED → *` is forbidden
   - `validateVaultTransition()` throws on illegal transitions

3. **No recovery path**:
   - User cannot reclaim vault by proving liveness
   - Database has no "unclaim" mechanism

---

## 8. Why User Access Is Revoked

### Rationale

The inheritance model assumes the user is **incapacitated or deceased**. If the vault became inheritable and the heir claimed it, the simplest interpretation is that the user is unable to check in.

Allowing concurrent access would create:
- **Conflict**: User and heir both modifying assets
- **Ambiguity**: Whose version is authoritative?
- **Security risk**: User could revoke heir access after heir has already seen secrets

### The Tradeoff

If the user was merely traveling/offline and the heir claimed maliciously:
- User loses access to their own vault
- This is by design: the grace period (30 days after 3 missed intervals = ~90-120 days total) should be sufficient for any legitimate scenario
- Users are warned via email during GRACE

---

## 9. Multi-Heir Handling

Current implementation stores `encryptedVaultKeyByHeir` as a JSON map:

```json
{
  "heir-uuid-1": "base64-rsa-encrypted-vault-key",
  "heir-uuid-2": "base64-rsa-encrypted-vault-key"
}
```

When a specific heir claims:
1. Server looks up `heirKeysMap[heirId]`
2. Returns only that heir's RSA-encrypted vault key
3. Only one heir can claim (first claim wins; vault becomes CLAIMED)

**Note**: No multi-heir quorum or Shamir secret sharing is implemented. This is a potential future enhancement.

---

## 10. Timeline Example

```
Day 0:    User creates vault, sets 30-day inactivity period
Day 30:   User unlocks vault (liveness proof) → state: ACTIVE
Day 60:   No unlock. daysSinceUnlock=30, missedIntervals=1 → Reminder sent
Day 90:   No unlock. missedIntervals=2 → Reminder sent
Day 120:  No unlock. missedIntervals=3 → state: GRACE, graceStartedAt=Day 120
Day 125:  User unlocks vault → state: ACTIVE, missedIntervals=0
Day 155:  No unlock. missedIntervals=1 (from Day 125)
Day 185:  No unlock. missedIntervals=2
Day 215:  No unlock. missedIntervals=3 → state: GRACE, graceStartedAt=Day 215
Day 245:  30 days in GRACE, no unlock → state: INHERITABLE
Day 250:  Heir claims vault → state: CLAIMED
Day 251+: User cannot unlock. Heir has read-only access.
```

---

## 11. Configuration

| Parameter | Default | Location |
|-----------|---------|----------|
| `inactivityPeriod` | 30 days | `user.inactivityPeriod` (per-user) |
| Grace duration | 30 days | Hardcoded in `liveness.service.js` |
| Intervals to GRACE | 3 | Hardcoded in `liveness.service.js` |
| Challenge expiry | 5 minutes | Hardcoded in controllers |
| Cron schedule | Daily 2 AM UTC | `server/src/cron.js` |
