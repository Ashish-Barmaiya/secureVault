# SecureVault Client Security

This document explains the client trust model, how sensitive data is handled in memory, and security boundaries enforced at the client layer.

---

## 1. Why the Client Must Be Trusted

SecureVault is a **zero-knowledge** system where the server never sees:
- User's Master Password
- Vault Key
- Decrypted assets

This means **all cryptographic operations happen on the client**. The security of the entire system depends on the client being trustworthy.

| If the client is compromised... | Consequence |
|---------------------------------|-------------|
| Keylogger captures password | Attacker can derive Master Key, decrypt Vault Key |
| Malware reads browser memory | Vault Key can be extracted during session |
| Malicious browser extension | Can intercept all crypto operations |
| Server serves backdoored JavaScript | User unknowingly runs attacker's code |

**There is no defense against a compromised client.** This is a fundamental limitation of client-side encryption.

---

## 2. Vault Key Lifecycle in Memory

### 2.1 When Vault Key Exists in Memory

The Vault Key exists in browser memory only during active vault sessions:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VAULT KEY MEMORY LIFECYCLE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. User enters Master Password                                     │
│     └─▶ Password in memory (briefly)                                │
│                                                                     │
│  2. PBKDF2 derivation                                               │
│     └─▶ Master Key in memory                                        │
│                                                                     │
│  3. AES decrypt encryptedVaultKey                                   │
│     └─▶ Vault Key in memory ◀── CRITICAL: This is the secret       │
│                                                                     │
│  4. User decrypts/encrypts assets                                   │
│     └─▶ Vault Key used repeatedly                                   │
│                                                                     │
│  5. User locks vault / logs out / closes tab                        │
│     └─▶ Vault Key should be cleared (best effort)                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Memory Clearing Limitations

JavaScript provides no guaranteed way to clear memory:
- `variable = null` does not erase the underlying bytes
- Garbage collection timing is non-deterministic
- Browser may keep copies in undo buffers, swap, etc.

**Best practices applied**:
- Variables holding secrets are reassigned as soon as practical
- No intentional caching of Vault Key across sessions
- Session storage (not localStorage) for any transient state

**Residual risk**: Memory forensics on a running browser can extract secrets.

---

## 3. Master Password Handling

### 3.1 Password Never Leaves Client

The password flow:
1. User types password into form
2. Client calls `deriveMasterKey(password, salt)`
3. Password is used in PBKDF2
4. Derived Master Key is used; password is no longer needed
5. Password variable is reassigned

**Server receives**: Only the encrypted Vault Key (already encrypted with Master Key)

**Server NEVER receives**: The password itself, or the derived Master Key

### 3.2 No Password Validation on Server

The server cannot validate whether the user entered the correct password:
- Server has no hash of the password
- Server has no way to decrypt the Vault Key to check

**Consequence**: If a user enters the wrong password:
- PBKDF2 produces a different Master Key
- AES decryption produces garbage
- Client detects failure (null/empty result from `decryptVaultKey`)
- Client reports failure locally

**Security benefit**: No password hash for attackers to target.

---

## 4. Why Server Never Verifies Passwords

| Approach | Risk | SecureVault Choice |
|----------|------|-------------------|
| Server stores password hash | Database leak exposes hashes for cracking | ❌ Not used |
| Server verifies by decrypting | Server must have key, breaking zero-knowledge | ❌ Not used |
| Client-side only validation | Wrong password = garbage decryption | ✅ Used |

The tradeoff:
- **Pro**: Server has no password-related data to leak
- **Con**: Server cannot help with password recovery

---

## 5. Rate Limiting for Unlock Attempts

Even though the server cannot verify passwords, rate limiting is still enforced:

| Mechanism | Purpose |
|-----------|---------|
| `vault.unlockFailureCount` | Track consecutive failures |
| `vault.lastFailureAt` | Timestamp for cooldown calculation |
| 5 failures → 15-minute cooldown | Slow down brute-force attempts |

### 5.1 How Rate Limiting Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RATE LIMITING FLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. User attempts unlock                                            │
│  2. Client calls /vault/unlock                                      │
│  3. Server returns encrypted vault key + salt                       │
│  4. Client attempts decryption                                      │
│  5a. If SUCCESS:                                                    │
│      - Client calls /challenge/submit with attestation              │
│      - Server resets unlockFailureCount to 0                        │
│  5b. If FAILURE:                                                    │
│      - Client calls /challenge/failure                              │
│      - Server increments unlockFailureCount                         │
│      - If count >= 5: return 429 with cooldown time                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Why Rate Limit Client-Reported Failures?

Q: If the client reports failures, can't an attacker just not report?

A: Yes, but:
1. A legitimate client always reports failures
2. An attacker scripting brute-force would skip failure reporting
3. BUT: The attacker cannot submit valid attestations without the correct Vault Key
4. Without valid attestations, liveness is not proven; vault eventually becomes inheritable

The rate limiting protects against:
- User accidentally locking themselves out
- Slow brute-force with legitimate client

It does NOT protect against:
- Offline brute-force with stolen encrypted vault key

---

## 6. Attestation Security

### 6.1 What Attestation Proves

The attestation is `AES-GCM(challenge || counter, vaultKey)`.

- **Only valid if**: Client knows the Vault Key
- **Server cannot generate**: Server doesn't have Vault Key
- **Server cannot verify decryption**: Just stores blob for audit

### 6.2 Why Server Trusts Client

The server cannot verify the attestation content, but:
1. If attestation is valid → client proved possession of Vault Key
2. If attestation is invalid → it doesn't matter; server just stores it
3. Liveness is proven by attestation submission, not decryption

The "trust" is that submitting a properly-formatted attestation indicates the client did the work. A malicious client could submit garbage, but:
- They won't get the Vault Key (no unlock)
- They still prove "some" activity (debatable; see limitations)

---

## 7. 2FA Enforcement

Two-factor authentication is mandatory for:
- Vault creation (`2FA is not enabled` → error)
- Heir account setup
- Claim initiation

**Implementation**: TOTP-based (RFC 6238) using `twoFactorSecret`.

**Why mandatory**: Password alone is insufficient; 2FA mitigates:
- Credential stuffing
- Phishing (attacker needs TOTP code too)
- Session hijacking (attacker needs ongoing TOTP access)

---

## 8. Session Security

| Mechanism | Configuration |
|-----------|---------------|
| JWT tokens | Access + Refresh tokens |
| HttpOnly cookies | Prevents JavaScript access |
| Session expiry | Configurable; defaults vary |
| HTTPS only | Cookies not sent over HTTP |

**Logout behavior**:
- Client clears local state
- Refresh token invalidation (if implemented)
- Vault Key should be cleared from memory

---

## 9. XSS Mitigations

| Defense | Implementation |
|---------|----------------|
| React auto-escaping | JSX escapes by default |
| Dangerously set inner HTML | Not used for user content |
| Content Security Policy | Should be configured (ops) |
| Input sanitization | Applied before rendering |

**Residual risk**: Novel XSS vectors, third-party library vulnerabilities.

---

## 10. Client-Side Security Checklist

| Check | Status |
|-------|--------|
| Vault Key not in localStorage | ✅ |
| Password not logged to console | ⚠️ Debug logs exist (remove in prod) |
| Secrets not in URL parameters | ✅ |
| HTTPS enforced | Ops-dependent |
| 2FA required | ✅ |
| Session timeout | Ops-dependent |
| CSP headers | Ops-dependent |

---

## 11. What Clients Must Implement Correctly

If building an alternative client (mobile app, CLI):

1. **PBKDF2** with exactly 600,000 iterations
2. **AES-256-CBC** for vault key encryption (IV prepended)
3. **AES-256-GCM** for asset encryption (96-bit IV, 128-bit tag)
4. **RSA-OAEP** with SHA-256 for heir key encapsulation
5. **Attestation format**: `challenge || "||" || counter`, encrypted with AES-GCM
6. **Never send** Master Password or Vault Key to server
7. **Report failures** to enable rate limiting
