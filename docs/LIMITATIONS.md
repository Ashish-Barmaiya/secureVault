# SecureVault Limitations

This document explicitly lists what SecureVault cannot protect against and the known limitations of the system.

---

## 1. Password Loss

### Scenario
User forgets their Master Password and has no Recovery Key.

### Outcome
**Vault is permanently unrecoverable.**

### Why
- Server does not know the password
- Vault Key is encrypted with Master Key derived from password
- Without Master Key, Vault Key cannot be decrypted
- Without Vault Key, assets cannot be decrypted

### Mitigation
- Users are encouraged to generate and store a Recovery Key during vault creation.
- Recovery Key is stored separately (e.g., safety deposit box, trusted family member).

---

## 2. Recovery Key Loss

### Scenario
User loses both Master Password and Recovery Key.

### Outcome
**Vault is permanently unrecoverable.**

### Why
Both the Master Password and Recovery Key can decrypt the Vault Key. If both are lost, there is no third path.

---

## 3. Heir Password Loss

### Scenario
Heir forgets their Heir Master Password.

### Outcome
**Heir cannot claim the vault, even if it's in INHERITABLE state.**

### Why
- Heir's RSA Private Key is encrypted with Heir Master Key
- Without Private Key, heir cannot decrypt the Vault Key
- No backdoor exists

### Partial Mitigation
- Heir can reset their account and generate new keys.
- **BUT**: User would need to re-encrypt Vault Key with heir's new public key.
- If user is deceased/inactive, this is impossible.

---

## 4. Client Compromise

### Scenario
User's device is compromised with keylogger, malware, or malicious browser extension.

### Outcome
**Attacker obtains Master Password and/or Vault Key.**

### Why
- All cryptographic operations happen in the client.
- Vault Key exists in browser memory during use.
- There is no application-level defense against a compromised execution environment.

### What SecureVault does NOT do
- Detect malware
- Secure the user's device
- Prevent keylogging

---

## 5. Phishing

### Scenario
User enters credentials on a fake SecureVault site.

### Outcome
**Attacker obtains password (and possibly 2FA code).**

### Partial Mitigation
- 2FA provides a second factor (attacker needs both).
- User education.

### Limitation
If attacker obtains both password and 2FA, they have full access.

---

## 6. Server Code Compromise

### Scenario
Attacker modifies server-side code to serve malicious client JavaScript.

### Outcome
**Client-side encryption is defeated; attacker can capture all secrets.**

### Why
- Users trust the JavaScript served by the server.
- Malicious JS could exfiltrate password, Vault Key, or decrypted assets.

### Mitigation (not implemented)
- Subresource Integrity (SRI) for static assets.
- Open-source client with reproducible builds.
- Browser extensions that verify code hash.

---

## 7. No Death Verification

### Scenario
User is on a long trip with no internet access. Heir claims vault.

### Outcome
**User loses access permanently upon heir claim.**

### Why
- SecureVault uses inactivity as proxy for incapacity/death.
- There is no external death verification (e.g., death certificate).

### Design Choice
- Grace period (30 days after GRACE entry) is intended to prevent false claims.
- Total time from last unlock to inheritability: ~90-120 days (3 intervals + grace).

---

## 8. Malicious Heir

### Scenario
Heir is alive, linked, and vault becomes INHERITABLE. Heir claims before user can check in.

### Outcome
**User loses access to their own vault.**

### Why
- CLAIMED is a terminal state.
- No mechanism to "unclaim" or dispute.

### Mitigation
- Choose heirs carefully.
- Set longer inactivity periods if uncertain about heir trustworthiness.
- Future consideration: multi-heir quorum.

---

## 9. Single-Heir Failure

### Scenario
User has one heir. That heir dies or becomes unreachable.

### Outcome
**No one can inherit the vault.**

### Why
- Vault Key is encrypted only with that heir's public key.
- No fallback heir.

### Mitigation
- Support multiple heirs (current implementation allows up to 3).
- Future consideration: automatic key redistribution if heir is removed.

---

## 10. No Modification After Claim

### Scenario
Heir claims vault and wants to add notes, reorganize assets.

### Outcome
**Not possible. Heir access is read-only.**

### Why
By design. See [DESIGN_DECISIONS.md](DESIGN_DECISIONS.md#11-why-read-only-inheritance).

---

## 11. Legal Limitations

### Scenario
Heir needs to prove legal right to assets (e.g., to a bank, exchange).

### Outcome
**SecureVault provides no legal documentation.**

### Why
- SecureVault is a cryptographic tool, not a legal instrument.
- It does not replace wills, trusts, or estate planning.
- A court may not recognize SecureVault claim as proof of ownership.

### Recommendation
- Users should consult estate planning attorneys.
- SecureVault should be used IN ADDITION TO, not instead of, legal mechanisms.

---

## 12. No Revocation of Claimed Access

### Scenario
After vault is claimed, user recovers and wants access back.

### Outcome
**Not possible.**

### Why
- CLAIMED is terminal.
- No dispute mechanism.

### Design Choice
This is intentional to prevent user from revoking access after heir has already seen secrets.

---

## 13. Quantum Computing (Long-Term)

### Scenario
Quantum computers become practical.

### Outcome
**RSA-2048 and current AES implementations may be vulnerable.**

### Timeline
- Grover's algorithm: AES-256 → ~128-bit security (still strong).
- Shor's algorithm: Breaks RSA entirely.

### Current Status
- Not a near-term concern.
- Future consideration: Migrate to post-quantum algorithms (e.g., Kyber, Dilithium).

---

## 14. Browser Memory Forensics

### Scenario
Attacker with physical access to device performs memory dump while vault is unlocked.

### Outcome
**Vault Key may be recoverable from memory.**

### Why
- JavaScript cannot reliably clear memory.
- GC timing is non-deterministic.

### Mitigation
- Lock vault when not in use.
- Use private browsing (some browsers handle memory differently).

---

## 15. Rate Limiting Bypass

### Scenario
Attacker obtains encrypted Vault Key (from database leak) and performs offline brute-force.

### Outcome
**Rate limiting provides no protection.**

### Why
- Rate limiting is enforced on API calls, not offline crypto operations.
- PBKDF2 with 600k iterations is the only defense.

### Impact
- Weak passwords can be cracked offline.
- Strong passwords (high entropy) remain safe.

---

## 16. Summary Table

| Limitation | Can be mitigated? | How? |
|------------|-------------------|------|
| Password loss | Partially | Recovery key |
| Heir password loss | Partially | Re-link heir (if user active) |
| Client compromise | No | Out of scope |
| Phishing | Partially | 2FA |
| Server code compromise | No | Would require external verification |
| Early claim by heir | Partially | Longer inactivity period |
| Single heir failure | Yes | Use multiple heirs |
| Legal recognition | No | Use legal instruments |
| Quantum computing | Future | Post-quantum migration |
| Memory forensics | Partially | Lock vault, private browsing |
| Offline brute-force | Partially | Strong password |
