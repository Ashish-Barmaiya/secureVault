# SecureVault Architecture

## 1. Problem Statement
In the digital age, a significant portion of wealth is held in digital assets. Unlike physical assets, digital assets (Crypto, Wallets) often lack standardized inheritance mechanisms. If a user dies without manually sharing credentials, these assets are lost forever. SecureVault provides a "Dead Man's Switch" to solve this.

## 2. Solution Overview
**SecureVault** is a Zero-Knowledge SaaS platform.
*   **Zero-Knowledge:** Server stores only encrypted data. Keys are managed on the client.
*   **SaaS Model:** Users sign up for the service; Heirs have a dedicated portal.
*   **Dead Man's Switch:** Automated inactivity checks trigger inheritance.

## 3. Workflow & Architecture

### 3.1. User Lifecycle (Vault Owner)
1.  **Registration:** User signs up (Email/Password).
2.  **2FA Setup:** Mandatory step before vault operations.
3.  **Vault Initialization:**
    *   Client generates `Vault Key` (Symmetric).
    *   User creates `Master Password`.
    *   `Vault Key` is encrypted by `Master Password` -> Sent to Server.
4.  **Asset Management:**
    *   User encrypts assets (Notes, Keys) with `Vault Key`.
    *   Server stores `encryptedPayload`.
5.  **Heir Invitation:**
    *   User sends link request to Heir email.

### 3.2. Heir Lifecycle (Beneficiary)
1.  **Onboarding:** Heir receives invite -> Goes to Heir Portal.
2.  **Registration & Security:** Signs up, enables 2FA.
3.  **Key Ceremony:**
    *   Heir creates `Heir Master Password`.
    *   Client generates `RSA Key Pair` (Public/Private).
    *   `Private Key` is encrypted with `Heir Master Password` -> Stored on Server.
    *   `Public Key` is stored on Server (Visible to Vault Owner).
4.  **Linking:**
    *   Heir accepts link request.
    *   **Behind the scenes:** User's client fetches Heir's Public Key -> Encrypts `Vault Key` with it -> Uploads `encryptedVaultKeyByHeir`.

### 3.3. Inheritance & Claiming (The "Read-Only" Access)
1.  **Trigger:** Dead Man's Switch expires (or verified death).
2.  **Claim:** Heir logs in -> Selects "Claim Vault".
3.  **Decryption:**
    *   Server sends `encryptedVaultKeyByHeir` + `Encrypted Private Key`.
    *   Heir decrypts `Private Key` using `Heir Master Password`.
    *   Heir decrypts `Vault Key` using `Private Key`.
4.  **Access:**
    *   Heir uses `Vault Key` to decrypt assets.
    *   **Restriction:** Access is strictly **Read-Only**. Heirs cannot delete or modify the original vault assets.

## 4. Pending & Future Architecture
*   **Key Rotation:** Robust mechanism to re-encrypt assets if user changes password.
*   **OAuth:** Google OAuth integration for friction-less onboarding (for both User and Heir).
*   **Heir Management:** UI for removing/modifying heirs dynamically.

## 5. Technology Stack
*   **Client:** Next.js (React), Redux, TailwindCSS.
*   **Server:** Node.js, Express.
*   **Database:** PostgreSQL (Prisma).
*   **Cryptography:**
    *   **Assets:** AES-256-GCM.
    *   **Inheritance:** RSA-2048 (for key encapsulation).
