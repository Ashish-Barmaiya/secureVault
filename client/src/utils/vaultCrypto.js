// /utils/vaultCrypto.js

import CryptoJS from "crypto-js";

// DERIVE_MASTER_KEY
/**
 * Derives a 256-bit master encryption key from the user's password and salt using PBKDF2.
 * This key is used to encrypt/decrypt the vaultKey.
 */
export function deriveMasterKey(password, salt) {
  const key = CryptoJS.PBKDF2(password, CryptoJS.enc.Base64.parse(salt), {
    keySize: 256 / 32,
    iterations: 600_000, // OWASP standard is at least 600,000 iterations as of 2024
  });
  return key.toString(CryptoJS.enc.Base64); // Base64 encoding for transport
}

// ENCRYPT_VAULT_KEY
/**
 * Encrypts the vaultKey using the provided encryption key (masterKey or recoveryKey).
 * Returns ciphertext in Base64.
 */
export function encryptVaultKey(vaultKey, encryptionKey) {
  const iv = CryptoJS.lib.WordArray.random(16); // AES-CBC needs IV
  const encrypted = CryptoJS.AES.encrypt(
    vaultKey,
    CryptoJS.enc.Base64.parse(encryptionKey),
    {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
      iv: iv,
    }
  );

  // Prepend IV to ciphertext so it can be recovered later during decryption
  const ivBase64 = iv.toString(CryptoJS.enc.Base64);
  return ivBase64 + ":" + encrypted.toString(); // e.g. iv:ciphertext
}

// GENERATE_RANDOM_SALT
/**
 * Generates a random 128-bit salt for use with PBKDF2.
 */
export function generateSalt() {
  return CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Base64);
}

// GENERATE_RANDOM_VAULT_KEY
/**
 * Generates a random 256-bit vaultKey used for encrypting vault contents.
 */
export function generateVaultKey() {
  return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64);
}

// GENERATE_RANDOM_RECOVERY_KEY
/**
 * Generates a 256-bit recovery key to optionally recover the vault later.
 */
export function generateRecoveryKey() {
  return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64);
}

// DECRYPT_VAULT_KEY
/**
 * Decrypts the encrypted vault key using the provided decryption key (masterKey or recoveryKey).
 * @param {string} encryptedData - The encrypted string in format "iv:ciphertext"
 * @param {string} decryptionKey - The base64-encoded key derived from password or recoveryKey
 * @returns {string} The decrypted vaultKey (base64 string)
 */
export function decryptVaultKey(encryptedData, decryptionKey) {
  try {
    const [ivBase64, ciphertext] = encryptedData.split(":");
    const iv = CryptoJS.enc.Base64.parse(ivBase64);
    const key = CryptoJS.enc.Base64.parse(decryptionKey);

    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
      iv: iv,
    });

    // If invalid, this can throw or return malformed
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

    // If empty, password was likely wrong
    if (!plaintext || plaintext.length < 10) {
      throw new Error("Decryption failed");
    }

    return decrypted.toString(CryptoJS.enc.Base64); // Vault key in base64
  } catch (error) {
    // Safely return null or let the caller throw a better error
    return null;
  }
}

// DECRYPT_TEXT_DATA
/**
 * Decrypts text data (like private key strings) that was encrypted with encryptVaultKey.
 * Unlike decryptVaultKey which returns base64, this returns the raw UTF-8 string.
 * Use this for data that was already a string before encryption (e.g., base64-encoded keys).
 */
export function decryptTextData(encryptedData, decryptionKey) {
  try {
    const [ivBase64, ciphertext] = encryptedData.split(":");
    const iv = CryptoJS.enc.Base64.parse(ivBase64);
    const key = CryptoJS.enc.Base64.parse(decryptionKey);

    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
      iv: iv,
    });

    // Return as UTF-8 string (not base64) - for text data like private key strings
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);

    if (!plaintext || plaintext.length < 10) {
      throw new Error("Decryption failed");
    }

    return plaintext;
  } catch (error) {
    return null;
  }
}

// Helper to convert base64 to ArrayBuffer and vice versa
function base64ToArrayBuffer(base64) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Turn vaultKey string into a CryptoKey
export async function importKeyFromVaultKey(vaultKey) {
  const keyBuffer = new TextEncoder().encode(vaultKey);
  const hash = await crypto.subtle.digest("SHA-256", keyBuffer); // ensure 256-bit
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

// ENCRYPT_ASSET_DATA_USING_VAULT_KEY
export async function encryptAssetData(plainText, vaultKey) {
  console.log("🔐 Encrypting this:", plainText);

  const key = await importKeyFromVaultKey(vaultKey);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM standard IV length

  const encoded = new TextEncoder().encode(plainText);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
  };
}

// DECRYPT_ASSET_DATA_USING_VAULT_KEY
export async function decryptAssetData(encryptedData, vaultKey) {
  const key = await importKeyFromVaultKey(vaultKey);

  let ciphertext, iv;

  // Handle both string format "ciphertext:iv" and object format {iv, ciphertext}
  if (typeof encryptedData === "string") {
    [ciphertext, iv] = encryptedData.split(":");
  } else {
    ciphertext = encryptedData.ciphertext;
    iv = encryptedData.iv;
  }

  console.log("🔓 Decrypting Asset:");
  console.log("  - Vault Key (first 10):", vaultKey?.substring(0, 10));
  console.log("  - Vault Key Length:", vaultKey?.length);
  console.log("  - Raw Input Type:", typeof encryptedData);
  if (typeof encryptedData === "string")
    console.log("  - Raw Input String:", encryptedData);
  console.log("  - Ciphertext Length:", ciphertext?.length);
  console.log("  - IV Length:", iv?.length);
  console.log("  - Ciphertext (first 20):", ciphertext?.substring(0, 20));
  console.log("  - IV (first 20):", iv?.substring(0, 20));

  const ivBuffer = base64ToArrayBuffer(iv);
  const encryptedBytes = base64ToArrayBuffer(ciphertext);

  console.log("  - IV Buffer Bytes:", ivBuffer.byteLength);
  console.log("  - Ciphertext Buffer Bytes:", encryptedBytes.byteLength);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBuffer,
    },
    key,
    encryptedBytes
  );

  console.log("📥 Raw decrypted buffer:", decrypted);

  return new TextDecoder().decode(decrypted);
}

// GENERATE_UNLOCK_ATTESTATION (VUA)
/**
 * CRYPTOGRAPHIC BOUNDARY: This proves the user successfully decrypted their vault.
 * Server cannot generate this without the genuine vaultKey.
 *
 * Generate vault unlock attestation using AES-GCM encryption.
 * Binds attestation to both challenge AND unlockCounter for replay protection.
 *
 * @param {string} challenge - Server-issued random challenge (hex string)
 * @param {number} unlockCounter - Current vault unlock counter from server
 * @param {string} vaultKey - Decrypted vault key (Base64)
 * @returns {Promise<{ciphertext: string, iv: string}>} Attestation object
 */
export async function generateUnlockAttestation(
  challenge,
  unlockCounter,
  vaultKey
) {
  try {
    // Bind attestation to both challenge AND counter (replay protection)
    const plaintext = challenge + "||" + unlockCounter.toString();

    // Import vaultKey as CryptoKey for AES-GCM
    const key = await importKeyFromVaultKey(vaultKey);

    // Generate random IV for AES-GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt plaintext
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    // Return attestation as base64-encoded ciphertext and IV
    return {
      ciphertext: arrayBufferToBase64(encrypted),
      iv: arrayBufferToBase64(iv),
    };
  } catch (error) {
    console.error("❌ Error generating unlock attestation:", error);
    throw new Error("Failed to generate unlock attestation");
  }
}

// GENERATE_HEIR_CLAIM_PROOF
/**
 * Generates the proof of possession for the heir claim process.
 * Encrypts the challenge + heirId using the vaultKey.
 *
 * @param {string} challenge - The challenge string from server
 * @param {string} heirId - The heir's ID
 * @param {string} vaultKey - The decrypted vault key
 * @returns {Promise<{ciphertext: string, iv: string}>} The proof object
 */
export async function generateHeirClaimProof(challenge, heirId, vaultKey) {
  try {
    const plaintext = challenge + "||" + heirId;
    const key = await importKeyFromVaultKey(vaultKey);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );

    return {
      ciphertext: arrayBufferToBase64(encrypted),
      iv: arrayBufferToBase64(iv),
    };
  } catch (error) {
    console.error("❌ Error generating heir claim proof:", error);
    throw new Error("Failed to generate claim proof");
  }
}

// DECRYPT_RSA (Client-side)
/**
 * Decrypts data using RSA Private Key.
 * Accepts either base64-encoded PKCS8 or PEM format.
 */
export async function decryptRSA(encryptedBase64, privateKeyInput) {
  try {
    console.log("🔍 DEBUG - decryptRSA function:");
    console.log(
      "  - Encrypted data (first 100 chars):",
      encryptedBase64?.substring(0, 100)
    );
    console.log(
      "  - Private key input (first 200 chars):",
      privateKeyInput?.substring(0, 200)
    );

    let binaryDer;

    // Check if input is PEM format or base64 PKCS8
    if (privateKeyInput.includes("-----BEGIN")) {
      console.log("  - Format: PEM (with headers)");
      // PEM format - strip headers
      const pemHeader = "-----BEGIN PRIVATE KEY-----";
      const pemFooter = "-----END PRIVATE KEY-----";
      const pemContents = privateKeyInput
        .replace(pemHeader, "")
        .replace(pemFooter, "")
        .replace(/\s/g, "");

      const binaryDerString = atob(pemContents);
      binaryDer = new Uint8Array(binaryDerString.length);
      for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
      }
    } else {
      console.log("  - Format: Base64 PKCS8 (no headers)");
      // Base64 PKCS8 format - use directly
      const binaryDerString = atob(privateKeyInput);
      binaryDer = new Uint8Array(binaryDerString.length);
      for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
      }
    }

    // 2. Import Key
    const key = await window.crypto.subtle.importKey(
      "pkcs8",
      binaryDer.buffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["decrypt"]
    );

    // 3. Decrypt
    const encryptedBytes = base64ToArrayBuffer(encryptedBase64);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      key,
      encryptedBytes
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error("❌ RSA Decryption failed:", error);
    throw new Error("Failed to decrypt vault key with RSA");
  }
}
