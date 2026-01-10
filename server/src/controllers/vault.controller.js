import prisma from "../db/prisma.js";
import AuditService from "../services/audit.service.js";
import { encryptVaultKey, decryptVaultKey } from "../utils/encryptVaultKey.js";
import { logActivity } from "../utils/logActivity.js";

// CREATE VAULT
const createVault = async (req, res) => {
  console.log("🛠️ Vault creation request received:", req.body);

  try {
    // get user id from request
    const userId = req.user.id;

    // get data from request body
    const {
      encryptedVaultKey,
      encryptedRecoveryKey,
      salt,
      encryptedVaultKeyByHeir,
    } = req.body;
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

    // Check if user has a linked and verified heir
    const heir = await prisma.heir.findFirst({
      where: {
        userId: userId,
        isVerified: true, // Heir must have completed key setup
      },
    });

    if (!heir) {
      return res.status(400).json({
        success: false,
        message:
          "You must link and verify an heir before creating a vault. Please add an heir from your dashboard.",
      });
    }

    // encrypt vault key
    const { ciphertext, iv } = encryptVaultKey(encryptedVaultKey);

    // encrypt recovery key
    const serverEncryptedRecoveryKey = encryptVaultKey(encryptedRecoveryKey);

    // encrypt heir vault keys (if present)
    let serverEncryptedHeirKeys = null;
    if (encryptedVaultKeyByHeir) {
      const heirKeysEncryption = encryptVaultKey(encryptedVaultKeyByHeir);
      serverEncryptedHeirKeys = JSON.stringify(heirKeysEncryption);
    }

    // encrypt salt (server-side only - client-side would create chicken-egg problem)
    const serverEncryptedSalt = encryptVaultKey(salt);

    // create vault
    // create vault and update user in transaction
    await prisma.$transaction(async (tx) => {
      const vault = await tx.vault.create({
        data: {
          userId,
          encryptedVaultKey: JSON.stringify({ ciphertext, iv }),
          encryptedRecoveryKey: JSON.stringify(serverEncryptedRecoveryKey),
          encryptedVaultKeyByHeir: serverEncryptedHeirKeys,
          salt: JSON.stringify(serverEncryptedSalt),
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { vaultCreated: true },
      });

      await AuditService.logAuditIntent(tx, {
        actorType: "USER",
        actorId: userId,
        targetType: "VAULT",
        targetId: vault.id,
        eventType: "VAULT_CREATED",
        eventVersion: 1,
        payload: {
          hasHeir: !!heir,
        },
      });
    });

    // Legacy log
    logActivity(req, userId, "VAULT_CREATED");

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
    const user = await prisma.user.findUnique({ where: { id: userId } });
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

    // CRITICAL: Enforce one-way state transition.
    // If vault is INHERITABLE or CLAIMED, user loses access PERMANENTLY.
    if (vault.state === "INHERITABLE" || vault.state === "CLAIMED") {
      return res.status(403).json({
        success: false,
        message:
          "Vault is no longer accessible. It has been transferred to your heir.",
      });
    }

    // decrypt vault key
    const { ciphertext, iv } = JSON.parse(vault.encryptedVaultKey);
    const decryptedVaultKey = decryptVaultKey(ciphertext, iv);

    // decrypt salt
    const encryptedSaltData = JSON.parse(vault.salt);
    const decryptedSalt = decryptVaultKey(
      encryptedSaltData.ciphertext,
      encryptedSaltData.iv
    );

    // Update lastSuccessfulUnlockAt and log audit
    await prisma.$transaction(async (tx) => {
      await tx.vault.update({
        where: { id: vault.id },
        data: {
          lastSuccessfulUnlockAt: new Date(),
          missedIntervals: 0, // Reset missed intervals on success
          state: "ACTIVE", // Ensure state is ACTIVE
        },
      });

      await AuditService.logAuditIntent(tx, {
        actorType: "USER",
        actorId: userId,
        targetType: "VAULT",
        targetId: vault.id,
        eventType: "VAULT_UNLOCK_SUCCESS",
        eventVersion: 1,
        payload: {},
      });
    });

    // return success response with vault data
    console.log("Vault unlocked successfully", decryptedVaultKey);
    return res.status(200).json({
      success: true,
      message: "Vault unlocked successfully",
      vault: {
        encryptedVaultKey: decryptedVaultKey,
        salt: decryptedSalt, // Decrypted salt returned to client
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

// GET LIVENESS STATUS
const getLivenessStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user to get inactivity period
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { inactivityPeriod: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Fetch vault with liveness data
    const vault = await prisma.vault.findUnique({
      where: { userId },
      select: {
        state: true,
        lastSuccessfulUnlockAt: true,
        missedIntervals: true,
        graceStartedAt: true,
        vaultUnlockCounter: true,
      },
    });

    if (!vault) {
      return res.status(404).json({
        success: false,
        message: "Vault not found",
      });
    }

    // Calculate next check-in date
    let nextCheckDate = null;
    const baseDate = vault.lastSuccessfulUnlockAt || vault.createdAt;

    if (baseDate) {
      nextCheckDate = new Date(
        baseDate.getTime() + user.inactivityPeriod * 24 * 60 * 60 * 1000
      );
    }

    return res.status(200).json({
      success: true,
      liveness: {
        state: vault.state,
        lastSuccessfulUnlockAt: vault.lastSuccessfulUnlockAt,
        missedIntervals: vault.missedIntervals,
        graceStartedAt: vault.graceStartedAt,
        nextCheckDate,
        inactivityPeriod: user.inactivityPeriod,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching liveness status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export { createVault, unlockVault, getLivenessStatus };
