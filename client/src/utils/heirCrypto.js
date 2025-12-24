import { deriveMasterKey, encryptVaultKey, decryptVaultKey } from "./vaultCrypto";

// 1. Generate RSA Key Pair
export async function generateRSAKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    publicKey: arrayBufferToBase64(publicKey),
    privateKey: arrayBufferToBase64(privateKey),
  };
}

// 2. Encrypt Private Key with Master Key (Symmetric)
// We can reuse encryptVaultKey from vaultCrypto.js as it does AES encryption
export function encryptHeirPrivateKey(privateKey, masterKey) {
  return encryptVaultKey(privateKey, masterKey);
}

// 3. Decrypt Private Key with Master Key
// Reuse decryptVaultKey
export function decryptHeirPrivateKey(encryptedPrivateKey, masterKey) {
  return decryptVaultKey(encryptedPrivateKey, masterKey);
}

// 4. Encrypt Vault Key with Heir's Public Key (Asymmetric)
// Used by User to grant access to Heir
export async function encryptVaultKeyWithHeirPublicKey(vaultKey, heirPublicKeyBase64) {
  const publicKeyBuffer = base64ToArrayBuffer(heirPublicKeyBase64);
  const publicKey = await window.crypto.subtle.importKey(
    "spki",
    publicKeyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );

  const encodedVaultKey = new TextEncoder().encode(vaultKey);
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    encodedVaultKey
  );

  return arrayBufferToBase64(encrypted);
}

// 5. Decrypt Vault Key with Heir's Private Key (Asymmetric)
// Used by Heir to access Vault
export async function decryptVaultKeyWithHeirPrivateKey(encryptedVaultKeyBase64, heirPrivateKeyBase64) {
  const privateKeyBuffer = base64ToArrayBuffer(heirPrivateKeyBase64);
  const privateKey = await window.crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["decrypt"]
  );

  const encryptedBuffer = base64ToArrayBuffer(encryptedVaultKeyBase64);
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    encryptedBuffer
  );

  return new TextDecoder().decode(decrypted);
}

// Helper functions (duplicated from vaultCrypto.js or imported if exported)
// vaultCrypto.js doesn't export them, so I'll redefine them here or export them from vaultCrypto.js
// For now, redefining to avoid modifying vaultCrypto.js too much unless necessary.

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
