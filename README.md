# SecureVault

**SecureVault** is a zero-knowledge digital inheritance platform. Users store encrypted assets in a vault. If the user becomes inactive for a prolonged period, a designated heir may claim read-only access to the vault.

---

## Problem Statement

Digital assets (cryptocurrency wallets, passwords, recovery phrases) are routinely lost when owners die without sharing credentials. Unlike physical property, digital assets have no default inheritance mechanism. SecureVault provides a cryptographic "Dead Man's Switch" that transfers access to a pre-designated heir after prolonged inactivity, without ever exposing secrets to the server.

---

## What SecureVault Does

1. **Client-Side Encryption**: All sensitive data is encrypted on the user's device before transmission. The server stores only ciphertext.
2. **Zero-Knowledge Storage**: The server cannot decrypt vault contents. It does not know the user's master password or vault key.
3. **Heir-Based Recovery**: Users designate an heir. The heir's RSA public key is used to encrypt the vault key. Only the heir can decrypt it.
4. **Inactivity-Triggered Inheritance**: If the user fails to unlock their vault for an extended period (configurable), the vault transitions to an inheritable state.
5. **Read-Only Heir Access**: After claiming, the heir can decrypt and view assets but cannot modify them. The original user's access is permanently revoked.

---

## Core Guarantees

| Guarantee | Mechanism |
|-----------|-----------|
| Server cannot decrypt vault | Server never receives master password or vault key |
| Inheritance requires inactivity | State machine requires ACTIVE → GRACE → INHERITABLE before claim |
| Heir cannot claim early | Vault must be in INHERITABLE state; server enforces |
| User access revoked after claim | CLAIMED is a terminal state; unlock endpoints reject |
| Replay attacks prevented | Monotonic unlock counter + single-use challenges |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                 │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────────┐   │
│  │ Master      │──▶│ Vault Key   │──▶│ Assets (AES-GCM)        │   │
│  │ Password    │   │ (AES-CBC)   │   │ encrypted client-side   │   │
│  └─────────────┘   └─────────────┘   └─────────────────────────┘   │
│         │                │                        │                 │
│         │                │                        │                 │
│         ▼                ▼                        ▼                 │
│  PBKDF2 (600k)    Encrypted with           Encrypted with          │
│  derives Master   Master Key               Vault Key               │
│  Key                                                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (ciphertext only)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                              SERVER                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Server Encryption Layer (AES-256-CBC with SERVER_SECRET)    │   │
│  │ Applied to all stored blobs (defense-in-depth)              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────────┐   │
│  │ Vault State │   │ Challenges  │   │ Encrypted Blobs         │   │
│  │ Machine     │   │ (5 min TTL) │   │ (double-encrypted)      │   │
│  └─────────────┘   └─────────────┘   └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## What SecureVault Does NOT Solve

| Non-Goal | Reason |
|----------|--------|
| Protection against client compromise | If malware captures the master password or vault key in memory, the system is compromised |
| Password recovery | If the user forgets their master password and loses the recovery key, the vault is unrecoverable |
| Legal enforcement of inheritance | SecureVault is a cryptographic mechanism, not a legal instrument |
| Multi-party authorization | Current design supports single heir; no quorum or threshold signatures |
| Real-time death detection | Inheritance is triggered by inactivity, not verified death |

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Actor model, trust boundaries, sequence diagrams |
| [CRYPTOGRAPHY.md](docs/CRYPTOGRAPHY.md) | Algorithm choices, key derivation, encryption layers |
| [INHERITANCE_MODEL.md](docs/INHERITANCE_MODEL.md) | Inactivity detection, grace period, claim process |
| [THREAT_MODEL.md](docs/THREAT_MODEL.md) | Threat actors, attack surfaces, mitigations |
| [CLIENT_SECURITY.md](docs/CLIENT_SECURITY.md) | Client trust requirements, memory handling |
| [API_OVERVIEW.md](docs/API_OVERVIEW.md) | Vault unlock, challenge-response, heir claim flows |
| [DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md) | Rationale for key architectural choices |
| [LIMITATIONS.md](docs/LIMITATIONS.md) | Explicit limitations and non-guarantees |
| [FUTURE_WORK.md](docs/FUTURE_WORK.md) | Planned enhancements |

---

## Tech Stack

- **Client**: Next.js 15 (React), Redux Toolkit, TailwindCSS
- **Server**: Node.js, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cryptography**:
  - PBKDF2 (600,000 iterations) for key derivation
  - AES-256-GCM for asset encryption
  - AES-256-CBC for vault key encryption
  - RSA-2048 (OAEP, SHA-256) for heir key encapsulation

---

## Local Development

```bash
# Clone
git clone https://github.com/yourusername/secureVault.git

# Server
cd server && npm install && npx prisma migrate dev && npm run dev

# Client (separate terminal)
cd client && npm install && npm run dev
```

---

## License

See [LICENSE](LICENSE) for details.
