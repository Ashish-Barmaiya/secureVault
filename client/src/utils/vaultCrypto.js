import CryptoJS from "crypto-js";

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

  // We'll prepend IV to ciphertext so it can be recovered later during decryption
  const ivBase64 = iv.toString(CryptoJS.enc.Base64);
  return ivBase64 + ":" + encrypted.toString(); // e.g. iv:ciphertext
}

/**
 * Generates a random 128-bit salt for use with PBKDF2.
 */
export function generateSalt() {
  return CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Base64);
}

/**
 * Generates a random 256-bit vaultKey used for encrypting vault contents.
 */
export function generateVaultKey() {
  return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64);
}

/**
 * Generates a 256-bit recovery key to optionally recover the vault later.
 */
export function generateRecoveryKey() {
  return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64);
}
