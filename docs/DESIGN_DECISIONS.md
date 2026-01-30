# SecureVault Design Decisions

This document explains the rationale behind key architectural and design choices in SecureVault.

---

## 1. Why Zero-Knowledge Architecture

### Decision
The server never has access to user passwords, vault keys, or decrypted assets.

### Rationale
1. **Minimal Trust**: Users need only trust the client code, not the server operator.
2. **Breach Resilience**: Database theft yields only encrypted blobs, not plaintext.
3. **Legal Protection**: Operator cannot be compelled to reveal what they don't have.

### Tradeoff
- **No password recovery**: Server cannot help if user forgets password.
- **Client complexity**: All crypto logic lives in the browser.
- **Verification limitation**: Server cannot confirm user entered correct password.

---

## 2. Why No Blockchain

### Decision
SecureVault uses a traditional client-server architecture with PostgreSQL, not a blockchain.

### Rationale
1. **Simplicity**: Blockchain adds complexity without clear benefit for this use case.
2. **Performance**: Database reads/writes are fast; blockchain consensus is slow.
3. **Cost**: No gas fees, no token economics.
4. **Privacy**: Blockchain is public by default; our vault data is private.
5. **Mutability is acceptable**: We need state transitions (ACTIVE → CLAIMED); immutability would complicate this.

### What blockchain would add
- Decentralization: But we're not trying to remove the operator.
- Immutable audit log: We have `AuditLog` tables; blockchain is overkill.
- Trustless: But client-side crypto already minimizes trust.

### Conclusion
Blockchain is a solution looking for a problem in this context. A well-designed traditional system is simpler, cheaper, and faster.

---

## 3. Why Mandatory Heir

### Decision
Users cannot create a vault without first linking a verified heir.

### Rationale
1. **Core purpose**: SecureVault exists for inheritance. A vault without an heir defeats the purpose.
2. **Irrecoverable vaults**: If user dies with no heir, assets are lost forever. This is worse than not using SecureVault.
3. **Forced completeness**: Users must think about inheritance upfront.

### Implementation
```javascript
const heir = await prisma.heir.findFirst({
  where: { userId, isVerified: true }
});
if (!heir) {
  return res.status(400).json({
    message: "You must link and verify an heir before creating a vault."
  });
}
```

### Tradeoff
- Users cannot "just try out" the vault without heir setup.
- Adds friction to onboarding.

---

## 4. Why Server-Side Encryption Layer

### Decision
All client-encrypted blobs are re-encrypted with `SERVER_SECRET` before storage.

### Rationale
1. **Defense-in-depth**: If database is leaked without `SERVER_SECRET`, attacker sees doubly-encrypted data.
2. **Separation of concerns**: Database admin cannot read even encrypted blobs without server config access.

### What it does NOT do
- Protect against server operator with full access.
- Replace client-side encryption.

### Tradeoff
- Adds CPU overhead for encryption/decryption on every read/write.
- `SERVER_SECRET` becomes a critical secret to protect.

---

## 5. Why No Server-Side Password Validation

### Decision
The server does not store password hashes or attempt to validate passwords.

### Rationale
1. **Zero-knowledge**: Password never touches the server.
2. **No hash to crack**: No bcrypt hash in database for attackers to brute-force.
3. **Simpler threat model**: One less attack surface.

### How wrong passwords are detected
- Client derives Master Key from password.
- Client attempts to decrypt Vault Key.
- If decryption fails (garbage output), client knows password was wrong.

### Tradeoff
- Server cannot help with "forgot password" flows.
- Rate limiting relies on client-reported failures.

---

## 6. Why PBKDF2 Over Argon2

### Decision
Key derivation uses PBKDF2 with 600,000 iterations.

### Rationale
1. **Browser compatibility**: PBKDF2 is natively supported in CryptoJS and Web Crypto.
2. **Standardization**: OWASP recommends 600k iterations for 2024.
3. **Argon2 limitations**: Requires WebAssembly in browsers; adds complexity.

### Tradeoff
- PBKDF2 is less resistant to GPU attacks than Argon2.
- Future consideration: Migrate to Argon2id when browser support improves.

---

## 7. Why RSA for Heir Key Sharing (Not ECC)

### Decision
Heir key encapsulation uses RSA-2048 with OAEP padding.

### Rationale
1. **Simplicity**: RSA key encapsulation is straightforward; one encrypt, one decrypt.
2. **Wide support**: Every browser and platform supports RSA-OAEP.
3. **No KDF needed**: RSA directly encrypts the vault key (up to ~245 bytes for 2048-bit).

### ECC alternative would require
- ECDH key exchange → shared secret
- KDF on shared secret → encryption key
- Symmetric encryption of vault key
- More moving parts = more implementation risk

### Tradeoff
- RSA-2048 keys are larger than ECC equivalents.
- RSA-2048 is weaker against quantum computers than ECC (though both are vulnerable).

---

## 8. Why One-Way State Machine

### Decision
Vault state transitions are strictly enforced: `ACTIVE → GRACE → INHERITABLE → CLAIMED`.

Forbidden:
- `INHERITABLE → ACTIVE`
- `CLAIMED → anything`

### Rationale
1. **Simplicity**: Clear, linear progression; no ambiguous states.
2. **Security**: Once heir claims, user cannot "reclaim" and lock out heir.
3. **Auditability**: State transitions are logged and irreversible.

### Tradeoff
- If user recovers after heir claims, user loses access permanently.
- This is by design: grace period should prevent false claims.

---

## 9. Why Challenge-Response Attestation

### Decision
Liveness proof requires client to encrypt a server-issued challenge with the Vault Key.

### Rationale
1. **Proof of key possession**: Only the client with the Vault Key can produce valid attestation.
2. **Replay prevention**: Monotonic counter + single-use challenge prevents reuse.
3. **Server remains blind**: Server stores attestation but cannot decrypt it.

### Alternative considered
- Password re-entry: But server doesn't know the password.
- TOTP-only: Proves user is alive, not that they have vault access.

---

## 10. Why 30-Day Grace Period

### Decision
After 3 missed liveness intervals, user has 30 days to recover before vault becomes inheritable.

### Rationale
1. **Generous buffer**: 30 days covers vacations, illness, temporary inaccessibility.
2. **Balance**: Long enough to prevent false positives; short enough for inheritance to happen in reasonable time.
3. **Configurable interval**: User sets `inactivityPeriod` (default 30 days per interval). 3 intervals + 30 days grace ≈ 120 days minimum.

### Tradeoff
- Long delay before inheritance activates.
- User might want faster inheritance in terminal illness scenarios.

---

## 11. Why Read-Only Inheritance

### Decision
Heirs have read-only access; they cannot modify vault contents.

### Rationale
1. **Preservation**: Original user's data should remain intact.
2. **Audit**: What heir sees is exactly what user stored.
3. **Simplicity**: No conflict resolution for concurrent access.

### Implementation
- No `/heir/vault/asset/update` endpoints.
- Backend checks prevent heirs from calling owner-only endpoints.

---

## 12. Why Mandatory 2FA

### Decision
2FA is required before vault creation and for sensitive operations.

### Rationale
1. **Defense-in-depth**: Password alone is insufficient.
2. **Phishing mitigation**: Attacker needs password + TOTP.
3. **Industry standard**: Most security-sensitive services require 2FA.

### Tradeoff
- Adds friction to setup.
- If user loses 2FA device, recovery is complex.

---

## 13. Summary of Tradeoffs

| Decision | Benefit | Cost |
|----------|---------|------|
| Zero-knowledge | Server can't leak secrets | No password recovery |
| No blockchain | Simple, fast, cheap | No decentralization |
| Mandatory heir | Ensures inheritance path | Onboarding friction |
| Server encryption layer | Defense-in-depth | CPU overhead |
| PBKDF2 | Browser compatibility | Weaker than Argon2 |
| RSA key encapsulation | Simplicity | Larger keys |
| One-way states | Security, clarity | No undo after claim |
| 30-day grace | Prevent false positives | Slow inheritance |
| Read-only inheritance | Preserves data | Heir can't reorganize |
