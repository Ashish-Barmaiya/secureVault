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
