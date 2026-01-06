import cron from "node-cron";
import { checkVaultLiveness } from "./services/liveness.service.js";
import AuditService from "./services/audit.service.js";

/**
 * DEAD MAN'S SWITCH - CRON JOBS
 *
 * Scheduled tasks for vault liveness monitoring
 */

if (process.env.ENABLE_BACKGROUND_JOBS !== "true") {
  console.log("⏸ Background jobs disabled");
} else {
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

  // Audit Processor - Run every 5 seconds
  setInterval(async () => {
    try {
      await AuditService.processOutbox();
    } catch (error) {
      console.error("❌ [AUDIT] Process outbox failed:", error);
    }
  }, 5000);

  console.log(
    "✅ CRON jobs initialized - scheduled daily vault liveness check at 2 AM UTC & Audit Processor every 5s"
  );
}
