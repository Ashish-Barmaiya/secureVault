# SecureVault Cryptography

This document provides a detailed breakdown of all cryptographic primitives, algorithms, and their justifications.

---

## 1. Algorithm Summary

| Purpose | Algorithm | Parameters |
|---------|-----------|------------|
| Key Derivation | PBKDF2-HMAC-SHA256 | 600,000 iterations, 128-bit salt |
| Vault Key Encryption | AES-256-CBC | 256-bit key, 128-bit IV |
| Asset Encryption | AES-256-GCM | 256-bit key, 96-bit IV, 128-bit tag |
| Heir Key Encapsulation | RSA-OAEP | 2048-bit modulus, SHA-256 |
| Server Blob Encryption | AES-256-CBC | Derived from SERVER_SECRET |
| Challenge Generation | CSPRNG | 256-bit (32 bytes) |
| Attestation | AES-256-GCM | Vault key, binds challenge + counter |

---

## 2. Key Derivation (PBKDF2)

**Function**: `deriveMasterKey(password, salt)`

**Algorithm**: PBKDF2-HMAC-SHA256

**Parameters**:
- Iterations: **600,000** (OWASP 2024 recommendation)
- Salt: **128 bits** (16 bytes), randomly generated per vault
- Output: **256-bit** key

**Why PBKDF2**:
- Well-understood, battle-tested
- Widely available in browsers (CryptoJS) and Node.js
- Iteration count is the primary security parameter; 600k is current best practice

**Why not Argon2**:
- Browser support is limited (requires WASM)
- PBKDF2 with high iteration count is acceptable for this threat model
- Future consideration: migrate to Argon2id when browser support improves

**Implementation** (client-side):
```javascript
const key = CryptoJS.PBKDF2(password, CryptoJS.enc.Base64.parse(salt), {
  keySize: 256 / 32,
  iterations: 600_000,
});
```

---

## 3. Vault Key Encryption (AES-256-CBC)

**Purpose**: Encrypt the randomly-generated Vault Key with the user's Master Key (derived from password).

**Algorithm**: AES-256-CBC

**Parameters**:
- Key: 256-bit Master Key
- IV: 128 bits, randomly generated per encryption
- Padding: PKCS7

**Format**: `iv:ciphertext` (both Base64-encoded)

**Why AES-CBC for key wrapping**:
- The Vault Key is random, high-entropy data
- CBC is sufficient for key wrapping where plaintext is indistinguishable from random
- CryptoJS default mode is CBC, reducing implementation risk

**Note**: Assets use AES-GCM (see below). The distinction is intentional.

---

## 4. Asset Encryption (AES-256-GCM)

**Purpose**: Encrypt user assets (secrets, notes, credentials) with the Vault Key.

**Algorithm**: AES-256-GCM (Galois/Counter Mode)

**Parameters**:
- Key: Vault Key (hashed to 256 bits via SHA-256)
- IV: 96 bits (12 bytes), randomly generated per encryption
- Authentication Tag: 128 bits (implicit in Web Crypto API)

**Why AES-GCM**:
- Authenticated encryption: provides confidentiality AND integrity
- Detects tampering; decryption fails if ciphertext is modified
- Web Crypto API native support (faster than CryptoJS)

**Key Import**:
```javascript
async function importKeyFromVaultKey(vaultKey) {
  const keyBuffer = new TextEncoder().encode(vaultKey);
  const hash = await crypto.subtle.digest("SHA-256", keyBuffer);
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, [
    "encrypt", "decrypt"
  ]);
}
```

**Data Format**: `{ ciphertext: base64, iv: base64 }`

---

## 5. Heir Key Encapsulation (RSA-OAEP)

**Purpose**: Enable non-interactive key sharing. User encrypts Vault Key with Heir's public key. Heir decrypts with their private key.

**Algorithm**: RSA-OAEP

**Parameters**:
- Modulus: **2048 bits**
- Public Exponent: 65537
- Hash: SHA-256
- Key Format: SPKI (public), PKCS8 (private)

**Why RSA-2048**:
- Sufficient security for medium-term secrets (NIST recommends 2048 until 2030)
- Wide browser and library support
- OAEP padding prevents chosen-ciphertext attacks

**Why not ECC/ECIES**:
- RSA key encapsulation is simpler to implement correctly
- ECIES requires additional KDF and MAC, increasing implementation surface
- Future consideration: migrate to X25519+XSalsa20-Poly1305 for smaller keys

**Flow**:
1. Heir generates RSA key pair client-side
2. Public key stored on server (not secret)
3. Private key encrypted with Heir's Master Key, stored on server
4. User encrypts Vault Key with Heir's public key → stored as `encryptedVaultKeyByHeir`

---

## 6. Server-Side Encryption (Defense-in-Depth)

**Purpose**: Add a second encryption layer to protect against database leaks.

**Algorithm**: AES-256-CBC

**Key Derivation**:
```javascript
const key = crypto.createHash("sha256").update(SERVER_SECRET).digest();
```

**What it protects**: If the database is leaked without `SERVER_SECRET`, the attacker sees double-encrypted blobs. They cannot even attempt to crack the client-side encryption.

**What it does NOT protect**: If `SERVER_SECRET` is compromised, this layer provides no benefit. The client-side encryption remains the primary security boundary.

**Encrypted fields**:
- `encryptedVaultKey`
- `encryptedRecoveryKey`
- `encryptedVaultKeyByHeir`
- `salt`
- Heir's `encryptedPrivateKey`
- Heir's `salt`

---

## 7. Challenge-Response Attestation

**Purpose**: Prove the client successfully derived the Vault Key without revealing it.

**Mechanism**:
1. Server generates 256-bit random challenge
2. Server provides current `unlockCounter` (monotonic)
3. Client constructs plaintext: `challenge || "||" || counter`
4. Client encrypts plaintext with Vault Key using AES-GCM
5. Client submits attestation to server
6. Server stores attestation blob (cannot decrypt)
7. Server validates challenge metadata and increments counter

**Why this works**:
- Only someone with the Vault Key can produce a valid AES-GCM ciphertext
- Counter binding prevents replay (same attestation rejected if counter doesn't match)
- 5-minute expiry prevents stale challenge reuse

**Why server doesn't verify decryption**:
- Server does not have the Vault Key
- Verification would require server to know the key, breaking zero-knowledge
- Instead, server trusts that if client can produce attestation, client has key

---

## 8. Encryption Layering

```
Asset Plaintext
        │
        ▼ AES-256-GCM (Vault Key)
        │
Asset Ciphertext (stored in assets.encryptedPayload)
        │
        ▼ AES-256-CBC (SERVER_SECRET) [server-side]
        │
Double-Encrypted Blob (stored in database)


Vault Key
        │
        ▼ AES-256-CBC (Master Key)
        │
Encrypted Vault Key (client-side)
        │
        ▼ AES-256-CBC (SERVER_SECRET) [server-side]
        │
Double-Encrypted Vault Key (stored in database)


Vault Key
        │
        ▼ RSA-OAEP (Heir's Public Key)
        │
Encrypted Vault Key for Heir
        │
        ▼ AES-256-CBC (SERVER_SECRET) [server-side]
        │
Double-Encrypted (stored in vault.encryptedVaultKeyByHeir)
```

---

## 9. What Happens If Keys Are Lost

| Scenario | Outcome |
|----------|---------|
| User forgets Master Password, has Recovery Key | Decrypt Vault Key with Recovery Key |
| User forgets Master Password, no Recovery Key | **Vault is permanently unrecoverable** |
| Heir forgets Heir Master Password | Heir cannot decrypt their RSA private key; **cannot claim vault** |
| SERVER_SECRET compromised | Attacker can strip server encryption layer; client-side encryption remains |
| Vault Key leaked | All assets compromised; no recovery |
| Heir's Private Key leaked | Attacker can decrypt Vault Key if vault becomes inheritable |

---

## 10. Attacks Mitigated

| Attack | Mitigation |
|--------|------------|
| Brute-force password | PBKDF2 with 600k iterations |
| Rainbow tables | Per-vault random salt |
| Database leak | Server-side encryption layer |
| Replay attack on unlock | Monotonic counter + single-use challenges |
| Chosen-ciphertext on key encapsulation | RSA-OAEP padding |
| Asset tampering detection | AES-GCM authentication tag |
| Timing attacks on password comparison | Server does not compare passwords |

---

## 11. Attacks NOT Mitigated

| Attack | Why |
|--------|-----|
| Client compromise (keylogger, malware) | Vault Key and password exist in memory during use |
| Phishing | User may enter password on fake site |
| Rubber-hose cryptanalysis | User can be coerced to reveal password |
| Quantum computing (long-term) | RSA-2048 and AES-256 are not quantum-resistant |
| Side-channel on client | Browser/device may leak via cache timing, etc. |

---

## 12. Cryptographic Constants

| Constant | Value | Location |
|----------|-------|----------|
| PBKDF2 Iterations | 600,000 | `client/src/utils/vaultCrypto.js` |
| Salt Size | 128 bits | `client/src/utils/vaultCrypto.js` |
| Vault Key Size | 256 bits | `client/src/utils/vaultCrypto.js` |
| AES-GCM IV Size | 96 bits | `client/src/utils/vaultCrypto.js` |
| RSA Modulus | 2048 bits | `client/src/utils/heirCrypto.js` |
| Challenge Size | 256 bits | `server/src/utils/challenge.js` |
| Challenge Expiry | 5 minutes | `server/src/controllers/challenge.controller.js` |
