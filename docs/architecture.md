# SecureVault Architecture

This document describes the technical architecture of SecureVault, including actor models, trust boundaries, key hierarchy, and detailed flows.

---

## 1. Actor Model

| Actor | Role | Capabilities |
|-------|------|--------------|
| **User** | Vault owner | Creates vault, encrypts assets, designates heir, submits liveness proofs |
| **Heir** | Beneficiary | Generates RSA key pair, accepts link request, claims vault after inactivity |
| **Server** | Blind storage | Stores encrypted blobs, manages state machine, issues challenges |
| **Client** | Crypto engine | All encryption/decryption operations; server never sees plaintext |
| **Cron** | Scheduler | Daily liveness checks, state transitions |

---

## 2. Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRUSTED ZONE (Client)                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ User's browser/device                                      │ │
│  │ - Master password entry                                    │ │
│  │ - Key derivation (PBKDF2)                                  │ │
│  │ - Vault key generation                                     │ │
│  │ - Asset encryption/decryption (AES-GCM)                    │ │
│  │ - RSA operations for heir key sharing                      │ │
│  │ - Attestation generation                                   │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ══════════│══════════ TRUST BOUNDARY
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  UNTRUSTED ZONE (Server)                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Server receives ONLY:                                      │ │
│  │ - Encrypted vault key (client-encrypted)                   │ │
│  │ - Encrypted assets (client-encrypted)                      │ │
│  │ - Public keys (not secrets)                                │ │
│  │ - Attestation blobs (cannot decrypt)                       │ │
│  │                                                            │ │
│  │ Server NEVER receives:                                     │ │
│  │ - Master password                                          │ │
│  │ - Vault key in plaintext                                   │ │
│  │ - Decrypted asset contents                                 │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Key Hierarchy

```
User's Master Password
         │
         ▼ PBKDF2 (600,000 iterations, 128-bit salt)
         │
    Master Key (256-bit)
         │
         ├──▶ Encrypts Vault Key (AES-256-CBC) ──▶ Stored on server
         │
         └──▶ Recovery Key (optional, user-generated 256-bit)
                    │
                    └──▶ Also encrypts Vault Key (AES-256-CBC) ──▶ Stored on server

Vault Key (256-bit, randomly generated)
         │
         ├──▶ Encrypts all assets (AES-256-GCM)
         │
         └──▶ Encrypted with Heir's RSA Public Key ──▶ Stored on server


Heir's Master Password
         │
         ▼ PBKDF2 (600,000 iterations, 128-bit salt)
         │
    Heir Master Key (256-bit)
         │
         └──▶ Encrypts Heir's RSA Private Key (AES-256-CBC) ──▶ Stored on server

Heir's RSA Key Pair (2048-bit)
         │
         ├──▶ Public Key: stored on server, used by User to encrypt Vault Key
         │
         └──▶ Private Key: encrypted with Heir Master Key, stored on server
```

---

## 4. Vault Creation Flow

```
User                                Client                              Server
  │                                    │                                   │
  │─── Master Password ───────────────▶│                                   │
  │                                    │                                   │
  │                                    │── Generate salt (128-bit) ──────▶ │
  │                                    │                                   │
  │                                    │── PBKDF2(password, salt) ───────▶ │
  │                                    │   = Master Key (256-bit)          │
  │                                    │                                   │
  │                                    │── Generate Vault Key (256-bit) ──▶│
  │                                    │                                   │
  │                                    │── AES-CBC(Vault Key, Master Key) ─│
  │                                    │   = Encrypted Vault Key           │
  │                                    │                                   │
  │                                    │── Fetch Heir's Public Key ───────▶│
  │                                    │◀── RSA Public Key ────────────────│
  │                                    │                                   │
  │                                    │── RSA-OAEP(Vault Key, HeirPubKey)─│
  │                                    │   = Encrypted Vault Key for Heir  │
  │                                    │                                   │
  │                                    │── POST /vault/create ────────────▶│
  │                                    │   { encryptedVaultKey,            │
  │                                    │     encryptedVaultKeyByHeir,      │
  │                                    │     salt }                        │
  │                                    │                                   │
  │                                    │                                   │── Server encrypts
  │                                    │                                   │   all blobs with
  │                                    │                                   │   SERVER_SECRET
  │                                    │                                   │   (defense-in-depth)
  │                                    │                                   │
  │                                    │◀── 201 Created ───────────────────│
  │                                    │                                   │
```

---

## 5. Vault Unlock Flow (Liveness Proof)

```
User                                Client                              Server
  │                                    │                                   │
  │─── Master Password ───────────────▶│                                   │
  │                                    │                                   │
  │                                    │── GET /challenge ────────────────▶│
  │                                    │◀── { challengeId, challenge,      │
  │                                    │       unlockCounter } ────────────│
  │                                    │                                   │
  │                                    │── POST /vault/unlock ────────────▶│
  │                                    │◀── { encryptedVaultKey, salt } ───│
  │                                    │                                   │
  │                                    │── PBKDF2(password, salt) ────────▶│
  │                                    │   = Master Key                    │
  │                                    │                                   │
  │                                    │── AES-CBC-Decrypt(encVaultKey,    │
  │                                    │      Master Key) ────────────────▶│
  │                                    │   = Vault Key                     │
  │                                    │                                   │
  │                                    │── Generate Attestation:           │
  │                                    │   plaintext = challenge || counter│
  │                                    │   attestation = AES-GCM(plaintext,│
  │                                    │                   Vault Key)      │
  │                                    │                                   │
  │                                    │── POST /challenge/submit ────────▶│
  │                                    │   { challengeId, unlockCounter,   │
  │                                    │     attestation }                 │
  │                                    │                                   │
  │                                    │                   ┌───────────────┤
  │                                    │                   │ Validate:     │
  │                                    │                   │ - Challenge   │
  │                                    │                   │   not expired │
  │                                    │                   │ - Not reused  │
  │                                    │                   │ - Counter     │
  │                                    │                   │   matches     │
  │                                    │                   │               │
  │                                    │                   │ Update:       │
  │                                    │                   │ - Increment   │
  │                                    │                   │   counter     │
  │                                    │                   │ - Reset state │
  │                                    │                   │   to ACTIVE   │
  │                                    │                   │ - Update      │
  │                                    │                   │   lastUnlock  │
  │                                    │                   └───────────────┤
  │                                    │◀── 200 OK ────────────────────────│
```

**Critical**: The server does NOT decrypt the attestation. It only validates metadata (challenge existence, expiry, counter match). The attestation is stored for audit purposes.

---

## 6. Heir Linking Flow

```
User (Vault Owner)                  Heir                               Server
  │                                    │                                   │
  │── Invite heir by email ───────────────────────────────────────────────▶│
  │                                    │◀── Email with invite link ────────│
  │                                    │                                   │
  │                                    │── Register account ──────────────▶│
  │                                    │── Enable 2FA ────────────────────▶│
  │                                    │                                   │
  │                                    │── Generate RSA Key Pair ─────────▶│
  │                                    │   (2048-bit, client-side)         │
  │                                    │                                   │
  │                                    │── Enter Heir Master Password ────▶│
  │                                    │── PBKDF2 = Heir Master Key ──────▶│
  │                                    │── AES-CBC(PrivateKey, MasterKey) ─│
  │                                    │   = Encrypted Private Key         │
  │                                    │                                   │
  │                                    │── POST /heir/keys ───────────────▶│
  │                                    │   { publicKey,                    │
  │                                    │     encryptedPrivateKey,          │
  │                                    │     salt }                        │
  │                                    │                                   │
  │                                    │── Accept link request ───────────▶│
  │                                    │                                   │
  │◀── Notification: Heir linked ──────────────────────────────────────────│
  │                                    │                                   │
  │── Fetch Heir's Public Key ────────────────────────────────────────────▶│
  │◀── RSA Public Key ─────────────────────────────────────────────────────│
  │                                    │                                   │
  │── Client: RSA-OAEP(VaultKey, HeirPubKey) ─────────────────────────────▶│
  │── POST /vault/update ─────────────────────────────────────────────────▶│
  │   { encryptedVaultKeyByHeir }      │                                   │
  │                                    │                                   │
```

---

## 7. Inheritance State Machine

```
                    ┌─────────────┐
                    │   ACTIVE    │◀──────────────────────────────────┐
                    └──────┬──────┘                                   │
                           │                                          │
                           │ 3+ missed liveness intervals             │ Liveness proof
                           │ (cron detects)                           │ submitted
                           ▼                                          │
                    ┌─────────────┐                                   │
                    │    GRACE    │───────────────────────────────────┘
                    └──────┬──────┘
                           │
                           │ 30 days in GRACE without proof
                           │ (cron transitions)
                           ▼
                    ┌─────────────┐
                    │ INHERITABLE │
                    └──────┬──────┘
                           │
                           │ Heir submits valid claim
                           │ (proof of vault key possession)
                           ▼
                    ┌─────────────┐
                    │   CLAIMED   │ ◀── TERMINAL STATE
                    └─────────────┘
                           │
                           │ User access PERMANENTLY revoked
                           │ Heir has READ-ONLY access
                           ▼
```

**State Transition Rules**:
- `ACTIVE → GRACE`: Allowed only by cron after 3+ missed intervals
- `GRACE → ACTIVE`: Allowed only via successful liveness proof
- `GRACE → INHERITABLE`: Allowed only by cron after 30-day grace period
- `INHERITABLE → CLAIMED`: Allowed only via heir's valid claim proof
- `CLAIMED → *`: Forbidden. Terminal state.
- `INHERITABLE → ACTIVE/GRACE`: Forbidden. One-way transition.

---

## 8. Heir Claim Flow

```
Heir                                Client                              Server
  │                                    │                                   │
  │                                    │── POST /heir/vault/initiate ─────▶│
  │                                    │   (requires vault.state ==        │
  │                                    │    INHERITABLE)                   │
  │                                    │◀── { encryptedVaultKeyForHeir,    │
  │                                    │       encryptedPrivateKey,        │
  │                                    │       salt, challenge,            │
  │                                    │       challengeId } ──────────────│
  │                                    │                                   │
  │─── Heir Master Password ──────────▶│                                   │
  │                                    │── PBKDF2(password, salt)          │
  │                                    │   = Heir Master Key               │
  │                                    │                                   │
  │                                    │── AES-CBC-Decrypt(encPrivKey,     │
  │                                    │     Heir Master Key)              │
  │                                    │   = RSA Private Key               │
  │                                    │                                   │
  │                                    │── RSA-OAEP-Decrypt(encVaultKey,   │
  │                                    │     RSA Private Key)              │
  │                                    │   = Vault Key                     │
  │                                    │                                   │
  │                                    │── Generate Proof:                 │
  │                                    │   proof = AES-GCM(challenge||     │
  │                                    │                   heirId,         │
  │                                    │                   Vault Key)      │
  │                                    │                                   │
  │                                    │── POST /heir/vault/claim ────────▶│
  │                                    │   { challengeId, proof }          │
  │                                    │                                   │
  │                                    │               ┌───────────────────┤
  │                                    │               │ Validate:         │
  │                                    │               │ - vault.state ==  │
  │                                    │               │     INHERITABLE   │
  │                                    │               │ - Challenge valid │
  │                                    │               │                   │
  │                                    │               │ Transition:       │
  │                                    │               │ - state = CLAIMED │
  │                                    │               │ - claimedAt = now │
  │                                    │               │                   │
  │                                    │               │ Store proof       │
  │                                    │               │ (audit trail)     │
  │                                    │               └───────────────────┤
  │                                    │◀── 200 OK ────────────────────────│
  │                                    │                                   │
  │                                    │── GET /heir/vault/assets ────────▶│
  │                                    │◀── { encryptedAssets } ───────────│
  │                                    │                                   │
  │                                    │── For each asset:                 │
  │                                    │   AES-GCM-Decrypt(asset, VaultKey)│
  │◀── Display decrypted assets ───────│                                   │
  │    (READ-ONLY)                     │                                   │
```

---

## 9. Why Server Cannot Decrypt Anything

| Data | Why Server Cannot Decrypt |
|------|---------------------------|
| Vault Key | Encrypted with user's Master Key (derived from password server never sees) |
| Assets | Encrypted with Vault Key (which server cannot decrypt) |
| Heir's Private Key | Encrypted with Heir's Master Key (derived from heir's password) |
| Attestation Blobs | Encrypted with Vault Key; server stores for audit only |

The server applies an **additional** encryption layer using `SERVER_SECRET` (AES-256-CBC). This is defense-in-depth: it protects against database leaks but provides no access to the server operator. Decryption of this layer yields the client-encrypted ciphertext, not plaintext.

---

## 10. Database Schema (Key Tables)

```
User
├── id, email, passwordHash
├── twoFactorEnabled, twoFactorSecret
├── inactivityPeriod (days)
└── vaultCreated

Vault
├── id, userId (1:1)
├── encryptedVaultKey (server-wrapped, client-encrypted)
├── encryptedRecoveryKey
├── encryptedVaultKeyByHeir (RSA-encrypted for each heir)
├── salt (server-wrapped)
├── state (ACTIVE | GRACE | INHERITABLE | CLAIMED)
├── lastSuccessfulUnlockAt
├── missedIntervals
├── graceStartedAt, claimedAt
├── vaultUnlockCounter (monotonic, replay protection)
└── unlockFailureCount, lastFailureAt (rate limiting)

Heir
├── id, name, email, relationship
├── userId (FK to User, if linked)
├── publicKey (RSA, for vault key encryption)
├── encryptedPrivateKey (server-wrapped, client-encrypted)
├── salt
├── linkStatus (PENDING | LINKED)
└── isVerified

Asset
├── id, vaultId (FK)
├── type (CRYPTO_WALLET, SECRET_NOTE, etc.)
└── encryptedPayload (client-encrypted with vault key)

UnlockChallenge
├── id, userId, vaultId
├── challenge (256-bit hex)
├── expiresAt (5 minutes)
└── used (boolean)

UnlockAttestation
├── id, userId, vaultId, challengeId
├── attestationBlob (encrypted, for audit)
└── ipAddress, userAgent, createdAt
```

---

## 11. Technology Stack

| Layer | Technology |
|-------|------------|
| Client | Next.js 15, React, Redux Toolkit, TailwindCSS |
| Server | Node.js, Express.js |
| Database | PostgreSQL, Prisma ORM |
| Crypto (Client) | Web Crypto API, CryptoJS |
| Crypto (Server) | Node.js `crypto` module |
| Scheduler | node-cron |
