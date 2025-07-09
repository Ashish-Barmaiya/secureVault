import env from "dotenv";
import crypto from "crypto";

env.config();

const SERVER_SECRET = process.env.SERVER_SECRET_TO_ENCRYPT_VAULTKEY;

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

export { encryptVaultKey };
