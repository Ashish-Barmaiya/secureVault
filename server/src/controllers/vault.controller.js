import { PrismaClient } from "@prisma/client";
import { encryptVaultKey, decryptVaultKey } from "../utils/encryptVaultKey.js";
import { logActivity } from "../utils/logActivity.js";

const prisma = new PrismaClient();

// CREATE VAULT
const createVault = async (req, res) => {
  console.log("🛠️ Vault creation request received:", req.body);

  try {
    // get user id from request
    const userId = req.user.id;

    // get data from request body
    const { encryptedVaultKey, encryptedRecoveryKey, salt, encryptedVaultKeyByHeir } = req.body;
    if (!userId || !encryptedVaultKey || !encryptedRecoveryKey || !salt) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    // check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // check if vault already exists
    const existingVault = await prisma.vault.findUnique({ where: { userId } });
    if (existingVault)
      return res
        .status(400)
        .json({ success: false, message: "Vault already exists" });

    // check 2fa is enabled
    if (!user.twoFactorEnabled) {
      return res
        .status(400)
        .json({ success: false, message: "2FA is not enabled" });
    }

    // encrypt vault key
    const { ciphertext, iv } = encryptVaultKey(encryptedVaultKey);

    // encrypt recovery key
    const serverEncryptedRecoveryKey = encryptVaultKey(encryptedRecoveryKey);

    // create vault
    await prisma.vault.create({
      data: {
        userId,
        encryptedVaultKey: JSON.stringify({ ciphertext, iv }),
        encryptedRecoveryKey: JSON.stringify(serverEncryptedRecoveryKey),
        encryptedVaultKeyByHeir, // Store as is (already encrypted by client)
        salt,
      },
    });

    // update user
    await prisma.user.update({
      where: { id: userId },
      data: { vaultCreated: true },
      // TODO: there is no need to have this field. Delete it later OR keep this field and add a new field that keeps count of total vaults user has. (maybe useful for quick query)
    });

    // log activity
    logActivity(req, userId, "VAULT_CREATED");
    if (logActivity) {
      console.log("Activity logged successfully for user:", userId);
    } else {
      console.error("Failed to log activity for user:", userId);
    }

    // return success response
    return res.status(201).json({
      success: true,
      message: "Vault created successfully",
    });
  } catch (error) {
    console.error("vault error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// UNLOCK VAULT
const unlockVault = async (req, res) => {
  try {
    // get user from request
    const userId = req.user.id;

    // check if user exists
    const user   = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // check if user has a vault
    const vault = await prisma.vault.findUnique({ where: { userId } });
    if (!vault) {
      return res
        .status(404)
        .json({ success: false, message: "Vault not found for this user" });
    }

    // decrypt vault key
    const { ciphertext, iv } = JSON.parse(vault.encryptedVaultKey);
    const decryptedVaultKey = decryptVaultKey(ciphertext, iv);

    // return success response with vault data
    console.log("Vault unlocked successfully", decryptedVaultKey);
    return res.status(200).json({
      success: true,
      message: "Vault unlocked successfully",
      vault: {
        encryptedVaultKey: decryptedVaultKey,
        salt: vault.salt,
      },
    });
  } catch (error) {
    console.error("error unlocking vault", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export { createVault, unlockVault };
