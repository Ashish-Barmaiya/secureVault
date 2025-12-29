import cron from "node-cron";
import { checkVaultLiveness } from "./services/liveness.service.js";

/**
 * DEAD MAN'S SWITCH - CRON JOBS
 *
 * Scheduled tasks for vault liveness monitoring
 */

// Run daily at 2 AM UTC
// Cron format: minute hour day month weekday
cron.schedule("0 2 * * *", async () => {
  console.log("🕰️  [CRON] Daily vault liveness check starting...");
  try {
    await checkVaultLiveness();
    console.log("✅ [CRON] Daily vault liveness check completed");
  } catch (error) {
    console.error("❌ [CRON] Daily vault liveness check failed:", error);
  }
});

console.log(
  "✅ CRON jobs initialized - scheduled daily vault liveness check at 2 AM UTC"
);
