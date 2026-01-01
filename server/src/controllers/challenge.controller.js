import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { logActivity } from "../utils/logActivity.js";
import { validateVaultTransition } from "../utils/vaultState.js";

const prisma = new PrismaClient();

/**
 * CRYPTOGRAPHIC BOUNDARY: Server issues challenges but cannot decrypt attestations.
 * The server NEVER has access to vaultKey, master password, or decrypted assets.
 */

// GENERATE CHALLENGE for Vault Unlock Attestation
export const generateChallenge = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user has a vault
    const vault = await prisma.vault.findUnique({
      where: { userId },
    });

    if (!vault) {
      return res.status(404).json({
        success: false,
        message: "Vault not found for this user",
      });
    }

    // Generate cryptographically secure random challenge (256-bit)
    const challenge = crypto.randomBytes(32).toString("hex");

    // Challenge expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Store challenge
    const unlockChallenge = await prisma.unlockChallenge.create({
      data: {
        userId,
        vaultId: vault.id,
        challenge,
        expiresAt,
        used: false,
      },
    });

    // Return challenge with current unlock counter (for replay protection)
    return res.status(200).json({
      success: true,
      challengeId: unlockChallenge.id,
      challenge,
      unlockCounter: vault.vaultUnlockCounter,
    });
  } catch (error) {
    console.error("❌ Error generating challenge:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// SUBMIT UNLOCK ATTESTATION (VUA)
export const submitAttestation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { challengeId, unlockCounter, attestation } = req.body;

    // Validate request body
    if (!challengeId || unlockCounter === undefined || !attestation) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: challengeId, unlockCounter, attestation",
      });
    }

    // CRYPTOGRAPHIC BOUNDARY: Server does NOT decrypt attestation
    // Server only validates: challenge exists, unused, not expired, counter matches

    // Fetch challenge
    const challenge = await prisma.unlockChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found",
      });
    }

    // Validate challenge ownership
    if (challenge.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Challenge does not belong to this user",
      });
    }

    // Validate challenge not already used
    if (challenge.used) {
      return res.status(400).json({
        success: false,
        message: "Challenge already used (replay attack prevented)",
      });
    }

    // Validate challenge not expired
    if (new Date() > challenge.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "Challenge expired",
      });
    }

    // Fetch vault
    const vault = await prisma.vault.findUnique({
      where: { userId },
    });

    if (!vault) {
      return res.status(404).json({
        success: false,
        message: "Vault not found",
      });
    }

    // CRITICAL: Validate unlockCounter matches (replay protection)
    if (unlockCounter !== vault.vaultUnlockCounter) {
      return res.status(400).json({
        success: false,
        message: "Invalid unlock counter (replay attack prevented)",
      });
    }

    // CRITICAL: Enforce one-way state transition.
    validateVaultTransition(vault.state, "ACTIVE");

    // All validations passed - update vault liveness
    const updatedVault = await prisma.vault.update({
      where: { userId },
      data: {
        vaultUnlockCounter: vault.vaultUnlockCounter + 1, // Increment monotonic counter
        lastSuccessfulUnlockAt: new Date(),
        missedIntervals: 0,
        state: "ACTIVE", // Reset to ACTIVE if in GRACE
        graceStartedAt: null,
        unlockFailureCount: 0, // Reset failure count on successful unlock
      },
    });

    // Mark challenge as used
    await prisma.unlockChallenge.update({
      where: { id: challengeId },
      data: { used: true },
    });

    // Store attestation for audit trail (encrypted blob, server cannot decrypt)
    await prisma.unlockAttestation.create({
      data: {
        userId,
        vaultId: vault.id,
        challengeId,
        attestationBlob: JSON.stringify(attestation),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("user-agent") || null,
      },
    });

    // Log activity
    await logActivity(req, userId, "VAULT_UNLOCK_SUCCESS");

    return res.status(200).json({
      success: true,
      message: "Liveness proof submitted successfully",
      vaultState: updatedVault.state,
      lastUnlock: updatedVault.lastSuccessfulUnlockAt,
    });
  } catch (error) {
    console.error("❌ Error submitting attestation:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// REPORT UNLOCK FAILURE (Rate Limiting Only)
export const reportFailure = async (req, res) => {
  try {
    const userId = req.user.id;

    // CRITICAL: This endpoint MUST NOT update liveness or counter
    // It is ONLY for rate limiting and abuse prevention

    const vault = await prisma.vault.findUnique({
      where: { userId },
    });

    if (!vault) {
      return res.status(404).json({
        success: false,
        message: "Vault not found",
      });
    }

    // Increment failure count
    const updatedVault = await prisma.vault.update({
      where: { userId },
      data: {
        unlockFailureCount: vault.unlockFailureCount + 1,
        lastFailureAt: new Date(),
        // CRITICAL: Do NOT update lastSuccessfulUnlockAt or vaultUnlockCounter
      },
    });

    // Log activity
    await logActivity(req, userId, "VAULT_UNLOCK_FAILED");

    // Apply rate limiting if too many failures
    const MAX_FAILURES = 5;
    const COOLDOWN_MINUTES = 15;

    if (updatedVault.unlockFailureCount >= MAX_FAILURES) {
      const cooldownUntil = new Date(
        updatedVault.lastFailureAt.getTime() + COOLDOWN_MINUTES * 60 * 1000
      );

      return res.status(429).json({
        success: false,
        message: `Too many failed unlock attempts. Please try again after ${COOLDOWN_MINUTES} minutes.`,
        cooldownUntil,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Unlock failure recorded",
      failureCount: updatedVault.unlockFailureCount,
    });
  } catch (error) {
    console.error("❌ Error reporting failure:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
