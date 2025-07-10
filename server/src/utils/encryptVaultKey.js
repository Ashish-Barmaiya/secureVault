import env from "dotenv";
import crypto from "crypto";

env.config();

const SERVER_SECRET = process.env.SERVER_SECRET_TO_ENCRYPT_VAULTKEY;

// Encrypt vault key
const encryptVaultKey = (data) => {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash("sha256").update(SERVER_SECRET).digest();
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(data, "utf8"),
    cipher.final(),
  ]);
  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
  };
};

// Decrypt vault key
const decryptVaultKey = (ciphertextBase64, ivBase64) => {
  const key = crypto.createHash("sha256").update(SERVER_SECRET).digest();
  const iv = Buffer.from(ivBase64, "base64");
  const encryptedText = Buffer.from(ciphertextBase64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};

export { encryptVaultKey, decryptVaultKey };
