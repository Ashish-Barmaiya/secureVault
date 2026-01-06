import prisma from "../src/db/prisma.js";
import AuditService from "../src/services/audit.service.js";
import { randomUUID } from "crypto";

const verifyAudit = async () => {
  console.log("🔍 Starting Audit System Verification...");

  const testUserId = randomUUID();
  const testVaultId = randomUUID();

  try {
    // 1. Simulate Transactional Write (Primary Action + Audit Intent)
    console.log("\n1️⃣  Testing Transactional Write...");
    await prisma.$transaction(async (tx) => {
      // Simulate creating a dummy user (we won't actually create it to avoid FK issues if we don't have all fields,
      // but we can just write to AuditOutbox directly to test the service)
      // Actually, let's try to create a real user if possible, or just skip the primary action and focus on AuditOutbox
      // But the requirement is "Primary action succeeds even if audit processor is down".
      // We want to test that writing to AuditOutbox works.

      await AuditService.logAuditIntent(tx, {
        actorType: "SYSTEM",
        actorId: "TEST_ACTOR",
        targetType: "ACCOUNT",
        targetId: "TEST_TARGET",
        eventType: "TEST_EVENT",
        eventVersion: 1,
        payload: { message: "Hello Audit" },
      });
    });
    console.log("✅ Transaction committed. Audit intent logged.");

    // 2. Verify Outbox Entry
    console.log("\n2️⃣  Verifying Outbox Entry...");
    const outboxItem = await prisma.auditOutbox.findFirst({
      where: { eventType: "TEST_EVENT", actorId: "TEST_ACTOR" },
    });

    if (!outboxItem) {
      throw new Error("❌ Outbox item NOT found!");
    }
    console.log("✅ Outbox item found:", outboxItem.id);

    // 3. Trigger Async Processor
    console.log("\n3️⃣  Triggering Async Processor...");
    await AuditService.processOutbox();
    console.log("✅ Processor ran.");

    // 4. Verify Audit Log
    console.log("\n4️⃣  Verifying Audit Log...");
    const logItem = await prisma.auditLog.findFirst({
      where: { eventType: "TEST_EVENT", actorId: "TEST_ACTOR" },
    });

    if (!logItem) {
      throw new Error("❌ Audit Log item NOT found!");
    }
    console.log("✅ Audit Log item found:", logItem.id);
    console.log("   Summary:", logItem.summary);

    // 5. Verify Outbox Processed State
    console.log("\n5️⃣  Verifying Outbox Processed State...");
    const processedOutbox = await prisma.auditOutbox.findUnique({
      where: { id: outboxItem.id },
    });

    if (!processedOutbox.processedAt) {
      throw new Error("❌ Outbox item NOT marked as processed!");
    }
    console.log(
      "✅ Outbox item marked processed at:",
      processedOutbox.processedAt
    );

    console.log("\n🎉 Audit System Verification PASSED!");
  } catch (error) {
    console.error("\n❌ Verification FAILED:", error);
  } finally {
    // Cleanup
    console.log("\n🧹 Cleaning up test data...");
    await prisma.auditLog.deleteMany({ where: { eventType: "TEST_EVENT" } });
    await prisma.auditOutbox.deleteMany({ where: { eventType: "TEST_EVENT" } });
    await prisma.$disconnect();
  }
};

verifyAudit();
