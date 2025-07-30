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
    iterations: 100_000,
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
export async function decryptAssetData({ ciphertext, iv }, vaultKey) {
  const key = await importKeyFromVaultKey(vaultKey);

  console.log("🔓 Decrypting with:", ciphertext, iv);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToArrayBuffer(iv),
    },
    key,
    base64ToArrayBuffer(ciphertext)
  );

  console.log("📥 Raw decrypted buffer:", decrypted);

  return new TextDecoder().decode(decrypted);
}
