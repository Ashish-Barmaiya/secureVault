import AssetService from "../services/asset.service.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const createAsset = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, encryptedPayload } = req.body;

    if (!type || !encryptedPayload) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: type, encryptedPayload",
      });
    }

    // Get vault
    const vault = await prisma.vault.findUnique({ where: { userId } });
    if (!vault) {
      return res
        .status(404)
        .json({ success: false, message: "Vault not found" });
    }

    // Check vault state
    if (vault.state === "INHERITABLE" || vault.state === "CLAIMED") {
      return res.status(403).json({
        success: false,
        message: "Vault is read-only. Access denied.",
      });
    }

    const context = {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    };

    const asset = await AssetService.createAsset(
      userId,
      vault.id,
      { type, encryptedPayload },
      context
    );

    return res.status(201).json({
      success: true,
      message: "Asset created successfully",
      data: asset,
    });
  } catch (error) {
    console.error("Create Asset Error:", error);
    if (error.code === "ASSET_LIMIT_REACHED") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getAssets = async (req, res) => {
  try {
    const userId = req.user.id;

    const vault = await prisma.vault.findUnique({ where: { userId } });
    if (!vault) {
      return res
        .status(404)
        .json({ success: false, message: "Vault not found" });
    }

    // Heirs access via separate route, but if user is accessing:
    if (vault.state === "CLAIMED") {
      // Maybe allow view only? Prompt says "HARD DENY if vault.state INHERITABLE, CLAIMED" for /dashboard/vault/asset/*
      // "Assets are accessed ONLY via: /dashboard/vault/asset/* ... HARD DENY if vault.state ∈ { INHERITABLE, CLAIMED }"
      return res.status(403).json({
        success: false,
        message: "Vault access denied. Vault is claimed or inheritable.",
      });
    }

    const assets = await AssetService.getAssets(vault.id);

    return res.status(200).json({
      success: true,
      data: assets,
    });
  } catch (error) {
    console.error("Get Assets Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateAsset = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { encryptedPayload } = req.body;

    if (!encryptedPayload) {
      return res.status(400).json({
        success: false,
        message: "Missing encryptedPayload",
      });
    }

    // Verify ownership
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { vault: true },
    });

    if (!asset || asset.vault.userId !== userId) {
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    }

    // Check vault state
    if (
      asset.vault.state === "INHERITABLE" ||
      asset.vault.state === "CLAIMED"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Vault is read-only." });
    }

    const context = {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    };

    const updatedAsset = await AssetService.updateAsset(
      userId,
      id,
      { encryptedPayload },
      context
    );

    return res.status(200).json({
      success: true,
      message: "Asset updated successfully",
      data: updatedAsset,
    });
  } catch (error) {
    console.error("Update Asset Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteAsset = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { vault: true },
    });

    if (!asset || asset.vault.userId !== userId) {
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    }

    if (
      asset.vault.state === "INHERITABLE" ||
      asset.vault.state === "CLAIMED"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Vault is read-only." });
    }

    const context = {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    };

    await AssetService.deleteAsset(userId, id, context);

    return res.status(200).json({
      success: true,
      message: "Asset deleted successfully",
    });
  } catch (error) {
    console.error("Delete Asset Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const logReveal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify ownership (optional but good for security)
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { vault: true },
    });

    if (!asset || asset.vault.userId !== userId) {
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    }

    const context = {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    };

    await AssetService.logReveal(userId, id, context);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Log Reveal Error:", error);
    return res.status(500).json({ success: false });
  }
};

const logHide = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: { vault: true },
    });

    if (!asset || asset.vault.userId !== userId) {
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    }

    const context = {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    };

    await AssetService.logHide(userId, id, context);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Log Hide Error:", error);
    return res.status(500).json({ success: false });
  }
};

export { createAsset, getAssets, updateAsset, deleteAsset, logReveal, logHide };
