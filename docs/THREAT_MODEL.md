# SecureVault Threat Model

This document analyzes the security threats SecureVault faces, the mitigations in place, and explicit assumptions and non-goals.

---

## 1. Threat Actors

| Actor | Motivation | Capabilities |
|-------|------------|--------------|
| **Malicious Insider (Server Operator)** | Access user secrets | Full database access, server code access |
| **External Attacker (Network)** | Steal credentials, assets | Man-in-the-middle, phishing, credential stuffing |
| **Malicious Heir** | Early claim, unauthorized access | Has heir account, may have user's email |
| **Database Attacker** | Mass secret extraction | SQL injection, database dump theft |
| **Client-Side Attacker** | Steal vault key or password | Malware, keylogger, browser extension |
| **Nation-State (Advanced)** | Targeted access | 0-days, rubber-hose, legal compulsion |

---

## 2. Attack Surfaces

### 2.1 Authentication

| Attack | Surface | Mitigation |
|--------|---------|------------|
| Credential stuffing | `/auth/login` | 2FA mandatory, rate limiting |
| Brute-force password | Login form | Account lockout after failures |
| Session hijacking | JWT tokens | HttpOnly cookies, short expiry |
| Password reset abuse | Email flow | OTP-based, time-limited |

### 2.2 Vault Operations

| Attack | Surface | Mitigation |
|--------|---------|------------|
| Replay unlock attestation | `/challenge/submit` | Monotonic counter, single-use challenges |
| Forge attestation | `/challenge/submit` | Attestation encrypted with vault key server doesn't have |
| Skip liveness, claim early | `/heir/vault/claim` | Server enforces `state == INHERITABLE` |
| Modify assets in transit | HTTPS | TLS encryption |

### 2.3 Data Storage

| Attack | Surface | Mitigation |
|--------|---------|------------|
| Database dump theft | PostgreSQL | Server-side encryption layer |
| SQL injection | ORM queries | Prisma parameterized queries |
| Backup theft | DB backups | Relies on ops (not application-level) |

### 2.4 Client-Side

| Attack | Surface | Mitigation |
|--------|---------|------------|
| Keylogger captures password | User device | Out of scope (see assumptions) |
| XSS steals vault key | Browser | React auto-escaping, CSP headers |
| Malicious browser extension | Browser | Out of scope (see assumptions) |

---

## 3. Detailed Threat Analysis

### 3.1 Server Operator Tries to Decrypt Vault

**Threat**: Malicious insider with database and `SERVER_SECRET` access attempts to read user secrets.

**Mitigation**:
1. Server stores only client-encrypted blobs
2. `SERVER_SECRET` decrypts to client-encrypted ciphertext, not plaintext
3. Server never receives user's Master Password or Vault Key
4. Operator cannot derive Master Key without password

**Residual Risk**: If operator also compromises client (e.g., serves backdoored JavaScript), all bets are off.

### 3.2 Database Leak

**Threat**: Attacker obtains database dump.

**Mitigation**:
1. All sensitive fields are server-encrypted with `SERVER_SECRET`
2. Even if attacker cracks server encryption, they get client-encrypted blobs
3. Client encryption uses PBKDF2 with 600k iterations

**Impact**: Attacker must:
1. Obtain database dump
2. Obtain `SERVER_SECRET` (separate compromise)
3. Brute-force each user's master password (600k iterations per guess)

### 3.3 Malicious Heir Claims Early

**Threat**: Heir tries to claim while vault is still ACTIVE or GRACE.

**Mitigation**:
```javascript
if (vault.state !== "INHERITABLE") {
  return res.status(403).json({
    message: "Vault is not in an inheritable state."
  });
}
```

**Residual Risk**: None. Server-side state check is authoritative.

### 3.4 Replay Attack on Liveness

**Threat**: Attacker captures a valid attestation and replays it to fake liveness.

**Mitigation**:
1. Attestation binds `challenge || unlockCounter`
2. Monotonic counter increments on each successful unlock
3. Challenge is marked `used: true` after submission
4. Challenge expires after 5 minutes

**Residual Risk**: Attacker would need to intercept attestation before it reaches server AND submit before user. Impractical timing window.

### 3.5 Phishing for Master Password

**Threat**: Attacker creates fake site, user enters password.

**Mitigation**:
- 2FA required (attacker would also need TOTP code)
- No application-level defense against determined phishing

**Residual Risk**: High. Phishing is a common attack vector. User education is the only mitigation.

### 3.6 Man-in-the-Middle

**Threat**: Attacker intercepts HTTPS traffic.

**Mitigation**:
- TLS 1.2+ required
- HSTS headers (if configured)
- Even if TLS is broken, attacker sees client-encrypted blobs

**Residual Risk**: TLS compromise is rare but possible (CA compromise, local proxy).

---

## 4. Attack Mitigations Summary

| Attack Vector | Mitigation | Strength |
|---------------|------------|----------|
| Password brute-force | PBKDF2 600k iterations | Strong |
| Database theft | Server + client encryption | Strong |
| Replay attacks | Monotonic counter + single-use challenge | Strong |
| Unauthorized heir claim | Server-enforced state machine | Strong |
| Session hijacking | 2FA, short JWT expiry | Moderate |
| Phishing | 2FA (partial) | Weak |
| Client compromise | None | Not mitigated |
| Insider with code access | Code review, access controls (ops) | Moderate |

---

## 5. Non-Goals

The following are explicitly **not** protected by SecureVault:

| Non-Goal | Reason |
|----------|--------|
| Client device compromise | If attacker has keylogger or memory access, they get the password/vault key |
| Legal compulsion | Court order can compel user to reveal password |
| Quantum computing | RSA-2048 and AES-256 are not quantum-resistant |
| Malicious client code | If server serves backdoored JS, user is compromised |
| Operational security | DB backups, server patching, network security are external concerns |
| Social engineering | User can be tricked into revealing password |
| Password recovery | Forgot password + lost recovery key = unrecoverable vault |

---

## 6. Explicit Assumptions

SecureVault's security relies on these assumptions being true:

| Assumption | Implication if False |
|------------|----------------------|
| User's device is not compromised | Password/vault key could be captured |
| TLS is secure | Traffic could be intercepted |
| User chooses strong password | Weak password can be brute-forced offline |
| Server code is not backdoored | Operator could exfiltrate secrets |
| User keeps recovery key safe | Lost recovery key = no backup |
| Heir does not collude with attacker | Heir's RSA key could be used maliciously |
| Time source is accurate | Cron-based transitions depend on real time |

---

## 7. Rate Limiting

| Endpoint | Limit | Behavior |
|----------|-------|----------|
| Vault unlock failures | 5 attempts | 15-minute cooldown |
| Challenge generation | Implicit (requires auth) | N/A |
| Heir claim | Single attempt per challenge | Challenge marked used |

**Implementation**: Failure count stored in `vault.unlockFailureCount`. Cooldown enforced in `reportFailure` controller.

---

## 8. Audit Trail

All security-relevant actions are logged:

| Event | Logged Data |
|-------|-------------|
| Vault unlock success | userId, vaultId, challengeId, IP, user-agent |
| Vault unlock failure | userId, vaultId, failure count |
| State transitions | vaultId, old state, new state, timestamp |
| Heir claim | heirId, vaultId, proof blob, IP, user-agent |

**Storage**: `UnlockAttestation`, `ActivityLog`, and `AuditLog` tables.

---

## 9. Incident Response Considerations

| Scenario | Response |
|----------|----------|
| `SERVER_SECRET` leaked | Rotate secret, re-encrypt all blobs (requires migration) |
| Database leaked | Notify users, rely on client-side encryption |
| User reports unauthorized claim | Investigate audit logs; no reversal mechanism |
| Suspected client-side compromise | User should change password, rotate vault key |

---

## 10. Future Security Enhancements

| Enhancement | Benefit |
|-------------|---------|
| Hardware security keys (WebAuthn) | Phishing-resistant 2FA |
| Argon2id for key derivation | Better resistance to GPU attacks |
| Client-side attestation (TPM) | Prove client is genuine |
| Zero-knowledge proofs for claims | Prove possession without revealing key |
| Multi-party computation | Remove single-server trust |
