# SecureVault

**SecureVault** is a Zero-Knowledge Digital Inheritance SaaS designed to secure your digital assets (Cryptocurrencies, Passwords, Documents) and ensure they are safely transferred to your loved ones in case of an unfortunate event.

> **Problem:** Billions of dollars in digital assets are lost annually because owners pass away without sharing their private keys.
> **Solution:** A secure, automated Dead Man's Switch ensuring your digital legacy survives you.

## 🚀 Key User Flows

### 👤 For Vault Owners (Users)
1.  **Register & Login:** Create an account to start securing your legacy.
2.  **Enable 2FA:** Mandatory Two-Factor Authentication for account security.
3.  **Create Vault:** Initialize your Zero-Knowledge vault.
4.  **Add Assets:** Securely store secrets (Crypto keys, Notes).
5.  **Add Heirs:** Invite beneficiaries to inherit your vault.
    *   *Note: Adding/Deleting Heirs is strictly controlled.*

### 👥 For Heirs (Beneficiaries)
1.  **Heir Portal:** Dedicated portal for designated heirs.
2.  **Register & 2FA:** Create an heir account and secure it.
3.  **Key Generation:** Generate RSA Key Pairs encrypted with a Master Password.
4.  **Link Account:** Accept or reject linking requests from Vault Owners.
5.  **Claim Access:**
    *   When a vault becomes **Inheritable** (Dead Man's Switch triggered), use your Master Password to unlock it.
    *   **Access Level:** Read-Only access to the inherited vault assets.

## 🚧 Development Roadmap

**Current Features (Built):**
*   User Registration & Auth
*   Vault Creation & Asset Management
*   Dead Man's Switch Logic
*   Heir Linking & Acceptance
*   Basic Inheritance Claiming

**In Progress / Planned:**
*   [ ] Google OAuth for Users
*   [ ] Google OAuth for Heirs
*   [ ] Key Rotation Mechanisms
*   [ ] Dynamic Adding/Deleting of Heirs
*   [ ] Advanced Death Verification Oracle

## 🛠️ Tech Stack

*   **Frontend:** [Next.js 15](https://nextjs.org/) (React), TailwindCSS, Redux Toolkit
*   **Backend:** Node.js, Express.js
*   **Database:** PostgreSQL with [Prisma ORM](https://www.prisma.io/)
*   **Security:**
    *   **User:** Client-side AES-256 (Assets), PBKDF2 (Keys).
    *   **Heir:** RSA Key Pairs (for non-interactive key sharing).

## 📄 Documentation

For a detailed deep-dive into the system architecture and security model, rationale, see [docs/architecture.md](docs/architecture.md).

---

### 💻 Local Development Setup

If you are a developer looking to contribute:

```bash
# Clone
git clone https://github.com/yourusername/secureVault.git

# Server
cd server && npm install && npx prisma migrate dev && npm run dev

# Client
cd client && npm install && npm run dev
```
