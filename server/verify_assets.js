import { PrismaClient } from "@prisma/client";
import AssetService from "./src/services/asset.service.js";

const prisma = new PrismaClient();

async function verifyAssetSystem() {
  console.log("🚀 Starting Asset System Verification...");

  try {
    // 1. Create a Test User and Vault
    console.log("👤 Creating test user...");
    const user = await prisma.user.create({
      data: {
        email: `test_asset_${Date.now()}@example.com`,
        passwordHash: "hash",
        vault: {
          create: {
            encryptedVaultKey: "key",
            encryptedRecoveryKey: "rec_key",
            salt: "salt",
          },
        },
      },
      include: { vault: true },
    });
    const vaultId = user.vault.id;
    console.log(`✅ User created. Vault ID: ${vaultId}`);

    // 2. Add 10 Assets (Should succeed)
    console.log("📦 Adding 10 assets...");
    for (let i = 0; i < 10; i++) {
      await AssetService.createAsset(
        user.id,
        vaultId,
        {
          type: "SECRET_NOTE",
          encryptedPayload: `{"title": "Asset ${i}"}`,
        },
        { ipAddress: "127.0.0.1", userAgent: "TestScript" }
      );
    }
    console.log("✅ Added 10 assets successfully.");

    // 3. Try Adding 11th Asset (Should Fail)
    console.log("🛑 Attempting to add 11th asset (Should fail)...");
    try {
      await AssetService.createAsset(
        user.id,
        vaultId,
        {
          type: "SECRET_NOTE",
          encryptedPayload: `{"title": "Asset 11"}`,
        },
        { ipAddress: "127.0.0.1", userAgent: "TestScript" }
      );
      console.error("❌ FAILED: 11th asset was added! Limit not enforced.");
    } catch (error) {
      if (error.code === "ASSET_LIMIT_REACHED") {
        console.log(
          "✅ SUCCESS: 11th asset rejected with ASSET_LIMIT_REACHED."
        );
      } else {
        console.error("❌ FAILED: Unexpected error:", error);
      }
    }

    // 4. Verify Audit Logs
    console.log("📜 Verifying audit logs...");
    // We expect 10 ASSET_CREATED events (plus maybe failed one if logged, but usually failed intent isn't logged in success path, or maybe it is?)
    // Our service logs *after* success in transaction. So 11th shouldn't log ASSET_CREATED.
    // But we might want to log failures? The prompt says "Every asset action MUST generate an audit event".
    // Usually successful ones.

    // Wait a bit for async logging if any (though our service awaits it)
    const logs = await prisma.auditOutbox.findMany({
      where: {
        actorId: user.id,
        eventType: "ASSET_CREATED",
      },
    });

    console.log(`Found ${logs.length} ASSET_CREATED logs.`);
    if (logs.length === 10) {
      console.log("✅ Audit Log Count Correct (10).");
    } else {
      console.error(
        `❌ Audit Log Count Incorrect. Expected 10, got ${logs.length}`
      );
    }

    // 5. Cleanup
    console.log("🧹 Cleaning up...");
    await prisma.asset.deleteMany({ where: { vaultId } });
    await prisma.vault.delete({ where: { id: vaultId } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log("✅ Cleanup complete.");
  } catch (error) {
    console.error("❌ Verification Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAssetSystem();
