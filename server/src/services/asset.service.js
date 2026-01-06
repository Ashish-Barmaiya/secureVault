import prisma from "../db/prisma.js";
import AuditService from "./audit.service.js";

class AssetService {
  /**
   * Create a new asset with strict limit enforcement and audit logging.
   */
  static async createAsset(userId, vaultId, assetData, context = {}) {
    const { ipAddress, userAgent } = context;

    // 1. Check limit (Hard enforcement)
    const count = await prisma.asset.count({
      where: { vaultId },
    });

    if (count >= 10) {
      const error = new Error("Asset limit reached (Max 10 per vault)");
      error.code = "ASSET_LIMIT_REACHED";
      throw error;
    }

    // 2. Transactional Create & Audit
    return await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.create({
        data: {
          vaultId,
          type: assetData.type,
          encryptedPayload: assetData.encryptedPayload,
        },
      });

      await AuditService.logAuditIntent(tx, {
        actorType: "USER",
        actorId: userId,
        targetType: "ASSET",
        targetId: asset.id,
        eventType: "ASSET_CREATED",
        eventVersion: 1,
        payload: {
          vaultId,
          type: asset.type,
          ipAddress,
          userAgent,
        },
      });

      return asset;
    });
  }

  /**
   * Update an existing asset.
   */
  static async updateAsset(userId, assetId, updateData, context = {}) {
    const { ipAddress, userAgent } = context;

    return await prisma.$transaction(async (tx) => {
      // Verify ownership implicitly via where clause in controller or here?
      // Better to fetch first to ensure existence and ownership if not handled by caller.
      // Assuming controller verifies ownership/vault access.

      const asset = await tx.asset.update({
        where: { id: assetId },
        data: {
          encryptedPayload: updateData.encryptedPayload,
          // Type usually shouldn't change, but if needed:
          // type: updateData.type
        },
      });

      await AuditService.logAuditIntent(tx, {
        actorType: "USER",
        actorId: userId,
        targetType: "ASSET",
        targetId: asset.id,
        eventType: "ASSET_UPDATED",
        eventVersion: 1,
        payload: {
          vaultId: asset.vaultId,
          type: asset.type,
          ipAddress,
          userAgent,
        },
      });

      return asset;
    });
  }

  /**
   * Delete an asset.
   */
  static async deleteAsset(userId, assetId, context = {}) {
    const { ipAddress, userAgent } = context;

    return await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.delete({
        where: { id: assetId },
      });

      await AuditService.logAuditIntent(tx, {
        actorType: "USER",
        actorId: userId,
        targetType: "ASSET",
        targetId: asset.id,
        eventType: "ASSET_DELETED",
        eventVersion: 1,
        payload: {
          vaultId: asset.vaultId,
          type: asset.type,
          ipAddress,
          userAgent,
        },
      });

      return asset;
    });
  }

  /**
   * List assets for a vault.
   */
  static async getAssets(vaultId) {
    return await prisma.asset.findMany({
      where: { vaultId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        encryptedPayload: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Log a reveal attempt (Audit only, no data change).
   */
  static async logReveal(userId, assetId, context = {}) {
    const { ipAddress, userAgent } = context;

    // Fetch asset to get vaultId/type for log
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return;

    await prisma.$transaction(async (tx) => {
      await AuditService.logAuditIntent(tx, {
        actorType: "USER",
        actorId: userId,
        targetType: "ASSET",
        targetId: assetId,
        eventType: "ASSET_REVEAL_REQUESTED",
        eventVersion: 1,
        payload: {
          vaultId: asset.vaultId,
          type: asset.type,
          ipAddress,
          userAgent,
        },
      });
    });
  }

  /**
   * Log a hide action (Audit only).
   */
  static async logHide(userId, assetId, context = {}) {
    const { ipAddress, userAgent } = context;

    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) return;

    await prisma.$transaction(async (tx) => {
      await AuditService.logAuditIntent(tx, {
        actorType: "USER",
        actorId: userId,
        targetType: "ASSET",
        targetId: assetId,
        eventType: "ASSET_HIDE_REQUESTED",
        eventVersion: 1,
        payload: {
          vaultId: asset.vaultId,
          type: asset.type,
          ipAddress,
          userAgent,
        },
      });
    });
  }
}

export default AssetService;
