import {
  encryptAssetData,
  decryptAssetData,
  generateVaultKey,
} from "./vaultCrypto.js";

function testEncryptionCycle() {
  const testKey = generateVaultKey();
  const testData = {
    privateKey: "test-private-key",
    seedPhrase: "test seed phrase",
  };

  console.log("Original data:", testData);

  const encrypted = encryptAssetData(testData, testKey);
  console.log("Encrypted:", encrypted);

  const decrypted = decryptAssetData(encrypted, testKey);
  console.log("Decrypted:", decrypted);

  if (JSON.stringify(testData) === JSON.stringify(decrypted)) {
    console.log("✅ Encryption/decryption works!");
  } else {
    console.error("❌ Encryption/decryption failed");
  }
}

testEncryptionCycle();
