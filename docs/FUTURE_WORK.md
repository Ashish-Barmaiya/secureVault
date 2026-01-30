# SecureVault Future Work

This document outlines potential future enhancements to SecureVault.

---

## 1. Shamir Secret Sharing

### Concept
Split the Vault Key into `n` shares, requiring `k` shares to reconstruct (k-of-n threshold).

### Benefits
- **No single point of failure**: Losing one share doesn't lose the vault.
- **Distributed trust**: Multiple heirs must cooperate to claim.
- **Escrow-friendly**: Shares can be held by attorneys, trustees.

### Implementation Considerations
- Use Shamir's Secret Sharing Scheme (SSSS) client-side.
- Store shares encrypted with different heir public keys.
- Claim requires `k` heirs to provide their decrypted shares.

### Challenges
- Key reconstruction must happen client-side.
- Coordination between heirs.
- UX complexity.

---

## 2. Multi-Heir Quorum

### Concept
Require multiple heirs to approve claim before vault transitions to CLAIMED.

### Benefits
- **Reduces malicious claim risk**: Single heir cannot unilaterally claim.
- **Verification layer**: Other heirs can verify user is truly inactive.

### Implementation
- `INHERITABLE → PENDING_CLAIM → CLAIMED`
- First heir initiates claim.
- Other heirs must approve within time window.
- If quorum reached, claim proceeds.

### Challenges
- What if heirs don't respond?
- Time limits and escalation paths.
- UI for heir coordination.

---

## 3. Hardware Key Integration

### Concept
Support hardware security keys (YubiKey, etc.) for 2FA and potentially vault key storage.

### Benefits
- **Phishing-resistant**: Hardware keys use WebAuthn/FIDO2.
- **Private key protection**: Hardware key can hold RSA/ECC key.

### Implementation Options
1. **WebAuthn for 2FA**: Replace TOTP with hardware key authentication.
2. **Hardware key as Master Key**: Vault Key could be wrapped to hardware key.

### Challenges
- Browser/platform support.
- Recovery if hardware key lost.
- Multiple hardware keys for redundancy.

---

## 4. Legal Attestations

### Concept
Integration with legal verification systems to strengthen inheritance legitimacy.

### Ideas
- **Death certificate upload**: Heirs upload verified death certificate.
- **Notarized documents**: PDF attestations with cryptographic signatures.
- **Third-party verification**: Integration with identity verification services.

### Benefits
- Adds layer of legitimacy beyond inactivity.
- May satisfy legal requirements in some jurisdictions.

### Challenges
- Verification is manual and trust-dependent.
- Not truly cryptographic.
- Legal validity varies by jurisdiction.

---

## 5. Zero-Knowledge Proofs for Claims

### Concept
Heir proves they have the Vault Key without revealing it, using ZK-SNARKs or similar.

### Benefits
- **Stronger privacy**: Proof reveals nothing about key material.
- **Verifiable**: Server can verify proof without knowing key.

### Current State
- Current attestation is AES-GCM encrypted challenge.
- Server cannot verify correctness (just stores blob).

### With ZKP
- Heir generates ZK proof: "I know `k` such that `Enc(k, challenge) = X`"
- Server verifies proof mathematically.

### Challenges
- Complex cryptography.
- Performance (ZK proofs can be slow).
- Library maturity in browsers.

---

## 6. Argon2id Migration

### Concept
Replace PBKDF2 with Argon2id for key derivation.

### Benefits
- **Memory-hard**: Resistant to GPU/ASIC attacks.
- **Better security margin**: OWASP prefers Argon2 over PBKDF2.

### Challenges
- Browser support requires WebAssembly.
- Migration path for existing vaults.
- Performance on low-end devices.

### Migration Strategy
1. Store key derivation algorithm version in vault metadata.
2. New vaults use Argon2id.
3. Existing vaults continue with PBKDF2.
4. Optional: Prompt users to upgrade.

---

## 7. Mobile Application

### Concept
Native iOS/Android app for vault access.

### Benefits
- **Better UX**: Native performance, biometric unlock.
- **Secure enclave**: Use device hardware for key storage.
- **Offline access**: Cache encrypted assets locally.

### Challenges
- Cryptographic implementation must match web client.
- Two codebases to maintain.
- App store review processes.

---

## 8. Key Rotation

### Concept
Allow users to change Master Password and re-encrypt Vault Key.

### Current State
- Changing password would require decrypting all assets and re-encrypting.
- Complex and error-prone.

### Implementation
1. User provides old password → decrypt Vault Key.
2. User provides new password → derive new Master Key.
3. Re-encrypt Vault Key with new Master Key.
4. Update server.
5. Re-encrypt heir's copy (if heir public key unchanged).

### Challenges
- Atomicity: Must complete or rollback fully.
- Heir key updates: Complexity increases.
- Asset re-encryption: May not be needed (Vault Key unchanged).

---

## 9. Configurable Grace Period

### Concept
Allow users to configure grace period duration (currently hardcoded 30 days).

### Benefits
- Users with high-risk situations might want shorter grace.
- Users with irregular access patterns might want longer grace.

### Implementation
- Add `gracePeriodDays` to user or vault settings.
- Liveness service uses per-vault value.

---

## 10. Audit Export

### Concept
Allow users (and heirs after claim) to export audit logs.

### Benefits
- Transparency: User knows all access events.
- Legal evidence: Timestamped access records.

### Implementation
- Endpoint to export `ActivityLog` and `UnlockAttestation` for a vault.
- Include cryptographic signatures for tamper evidence.

---

## 11. Self-Destruct Mode

### Concept
Intentional vault destruction after certain conditions.

### Scenarios
- User explicitly triggers destruction.
- Vault not claimed within X years of inheritable state.

### Benefits
- Privacy: Secrets don't persist forever.
- Attack mitigation: If attackers compromise heir, vault can be destroyed.

### Challenges
- Accidental triggering.
- No recovery after destruction.

---

## 12. Encrypted Email Notifications

### Concept
Encrypt email notifications to heirs using their public key.

### Current State
- Emails are plaintext (sent via nodemailer, stub implementations).

### Benefits
- Heir can verify email authenticity.
- Email contents protected from mail server.

### Challenges
- Heirs would need email clients that support decryption.
- PGP/S-MIME integration complexity.

---

## 13. Post-Quantum Cryptography

### Concept
Migrate to quantum-resistant algorithms.

### Timeline
- NIST PQC standardization completed (Kyber, Dilithium).
- Browser support emerging.

### Migration Path
1. Dual-algorithm approach: RSA + Kyber hybrid.
2. New vaults use PQC.
3. Existing vaults prompt for migration.

### Implementation
- Replace RSA-2048 with Kyber-768 (key encapsulation).
- Replace ECDSA signatures (if used) with Dilithium.

---

## 14. Priority Matrix

| Enhancement | Impact | Complexity | Priority |
|-------------|--------|------------|----------|
| Shamir Secret Sharing | High | High | Medium |
| Multi-Heir Quorum | High | Medium | High |
| Hardware Key (WebAuthn) | Medium | Medium | High |
| Argon2id Migration | Medium | Medium | Medium |
| Key Rotation | Medium | High | Medium |
| Mobile App | High | High | Low (deferred) |
| ZK Proofs | Medium | Very High | Low (research) |
| Post-Quantum | Medium | High | Low (future) |
| Configurable Grace | Low | Low | High |
| Audit Export | Low | Low | Medium |

---

## 15. Research Areas

| Area | Goal |
|------|------|
| Threshold cryptography | k-of-n without revealing shares to server |
| Secure multi-party computation | Heir coordination without trust |
| Trusted execution environments | Server-side attestation |
| Verifiable delay functions | Time-locked cryptography for inheritance |
| Decentralized identity | DID-based heir verification |
