import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
import { validateVaultTransition } from "../utils/vaultState.js";

/**
 * DEAD MAN'S SWITCH - LIVENESS SERVICE
 *
 * Runs daily to check vault liveness and perform state transitions.
 * This service implements the Grace Period state machine.
 */

/**
 * Check all vaults and perform liveness state transitions
 */
export async function checkVaultLiveness() {
  console.log("🕰️  Starting vault liveness check...");

  try {
    // Fetch all vaults that are ACTIVE or GRACE (not yet claimed or inheritable)
    const vaults = await prisma.vault.findMany({
      where: {
        state: {
          in: ["ACTIVE", "GRACE"],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            inactivityPeriod: true,
          },
        },
      },
    });

    console.log(`📊 Checking ${vaults.length} vaults for liveness...`);

    for (const vault of vaults) {
      await processVaultLiveness(vault);
    }

    console.log("✅ Vault liveness check completed");
  } catch (error) {
    console.error("❌ Error during liveness check:", error);
    throw error;
  }
}

/**
 * Process liveness for a single vault
 */
async function processVaultLiveness(vault) {
  const { user, lastSuccessfulUnlockAt, state, graceStartedAt } = vault;

  if (!lastSuccessfulUnlockAt) {
    // Vault never unlocked - set initial unlock time to vault creation
    console.log(`⏭️  Vault ${vault.id} never unlocked, skipping for now`);
    return;
  }

  // Calculate days since last successful unlock
  const now = new Date();
  const daysSinceUnlock = Math.floor(
    (now.getTime() - lastSuccessfulUnlockAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate missed intervals based on user's inactivity period
  const missedIntervals = Math.floor(daysSinceUnlock / user.inactivityPeriod);

  console.log(
    `🔍 Vault ${vault.id} (${user.email}): ${daysSinceUnlock} days since unlock, ${missedIntervals} missed intervals`
  );

  // ============================================================
  // PROGRESSIVE NOTIFICATIONS (any missed interval)
  // ============================================================
  if (missedIntervals >= 1 && state === "ACTIVE") {
    console.log(`📧 Sending reminder notification to ${user.email}`);
    // TODO: Send email notification
    // TODO: Create dashboard banner notification
    await sendMissedIntervalNotification(user, vault, missedIntervals);
  }

  // ============================================================
  // STATE TRANSITION: ACTIVE → GRACE
  // ============================================================
  if (missedIntervals >= 3 && state === "ACTIVE") {
    console.log(`⚠️  Vault ${vault.id} entering GRACE period`);

    validateVaultTransition(state, "GRACE");

    await prisma.vault.update({
      where: { id: vault.id },
      data: {
        state: "GRACE",
        graceStartedAt: now,
        missedIntervals,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "VAULT_STATE_GRACE",
        ipAddress: null,
        userAgent: "CRON",
      },
    });

    // Send aggressive notifications
    await sendGraceWarningToUser(user, vault);
    await sendGraceInfoToHeirs(user, vault);

    return;
  }

  // ============================================================
  // STATE TRANSITION: GRACE → INHERITABLE
  // ============================================================
  if (state === "GRACE" && graceStartedAt) {
    const GRACE_PERIOD_DAYS = 30;
    const daysSinceGrace = Math.floor(
      (now.getTime() - graceStartedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceGrace >= GRACE_PERIOD_DAYS) {
      console.log(`🚨 Vault ${vault.id} transitioning to INHERITABLE`);

      validateVaultTransition(state, "INHERITABLE");

      await prisma.vault.update({
        where: { id: vault.id },
        data: {
          state: "INHERITABLE",
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "VAULT_STATE_INHERITABLE",
          ipAddress: null,
          userAgent: "CRON",
        },
      });

      // Send final notifications
      await sendInheritableFinalToUser(user, vault);
      await sendInheritableActiveToHeirs(user, vault);

      return;
    }
  }

  // ============================================================
  // UPDATE MISSED INTERVALS (for dashboard display)
  // ============================================================
  if (vault.missedIntervals !== missedIntervals) {
    await prisma.vault.update({
      where: { id: vault.id },
      data: { missedIntervals },
    });
  }
}

/**
 * Send reminder notification for missed intervals
 */
async function sendMissedIntervalNotification(user, vault, missedIntervals) {
  console.log(
    `📧 [TODO] Send missed interval notification to ${user.email} (${missedIntervals} missed)`
  );
  // TODO: Implement email service integration
  // Email content: "You've missed ${missedIntervals} liveness check-ins. Please unlock your vault to submit liveness proof."
}

/**
 * Send aggressive warning when entering GRACE period
 */
async function sendGraceWarningToUser(user, vault) {
  console.log(`📧 [TODO] Send GRACE warning to ${user.email}`);
  // TODO: Implement email service integration
  // Email content: "⚠️ URGENT: Your vault is now in GRACE period. You have 30 days to unlock your vault or your heirs will be able to claim it."
}

/**
 * Send informational notification to heirs about GRACE
 */
async function sendGraceInfoToHeirs(user, vault) {
  console.log(`📧 [TODO] Send GRACE info to heirs of ${user.email}`);
  // TODO: Fetch heirs and send informational emails
  // Email content: "The vault owner has been inactive for an extended period. The vault is now in a grace period."
}

/**
 * Send final notification to user when vault becomes INHERITABLE
 */
async function sendInheritableFinalToUser(user, vault) {
  console.log(`📧 [TODO] Send INHERITABLE final notice to ${user.email}`);
  // TODO: Implement email service integration
  // Email content: "Your vault is now INHERITABLE. Your designated heirs can now claim access."
}

/**
 * Send active notification to heirs that vault is claimable
 */
async function sendInheritableActiveToHeirs(user, vault) {
  console.log(
    `📧 [TODO] Send INHERITABLE active notice to heirs of ${user.email}`
  );
  // TODO: Fetch heirs and send claim instructions
  // Email content: "The vault is now claimable. You may begin the claim process."
}
