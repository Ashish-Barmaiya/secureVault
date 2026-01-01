import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const addCryptoWallet = async (req, res) => {
  try {
    // get user from request
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // get vault for the user
    const vault = await prisma.vault.findUnique({ where: { userId } });
    if (!vault) {
      return res.status(404).json({
        success: false,
        message: "Vault not found",
      });
    }

    // CRITICAL: Enforce one-way state transition.
    if (vault.state === "INHERITABLE" || vault.state === "CLAIMED") {
      return res.status(403).json({
        success: false,
        message: "Vault is read-only. Access denied.",
      });
    }

    // get the data from the request body
    const { title, publicAddress, network, encryptedData } = req.body;

    if (
      !title ||
      !publicAddress ||
      !network ||
      !encryptedData ||
      typeof encryptedData !== "string" ||
      encryptedData.length < 20
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing or invalid required fields. Ensure vault is unlocked.",
      });
    }

    // Start interactive transaction
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Create DigitalAsset
      const digitalAsset = await tx.digitalAsset.create({
        data: {
          type: "CRYPTO_WALLET",
          title,
          vaultId: vault.id,
          userId: user.id,
        },
      });

      // Step 2: Create CryptoWallet linked to the above asset
      const cryptoWallet = await tx.cryptoWallet.create({
        data: {
          assetId: digitalAsset.id,
          publicAddress,
          network,
          encryptedData,
        },
      });

      return { digitalAsset, cryptoWallet };
    });

    console.log("Crypto wallet added successfully");

    return res.status(201).json({
      success: true,
      message: "Crypto wallet added successfully",
      data: result,
    });
  } catch (error) {
    console.error("Add Crypto Wallet Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Crypto Wallets
const getCryptoWallets = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const vault = await prisma.vault.findUnique({ where: { userId } });
    if (!vault) {
      return res
        .status(404)
        .json({ success: false, message: "Vault not found" });
    }

    // CRITICAL: Enforce one-way state transition.
    if (vault.state === "INHERITABLE" || vault.state === "CLAIMED") {
      return res.status(403).json({
        success: false,
        message: "Vault is no longer accessible.",
      });
    }

    const cryptoWallets = await prisma.cryptoWallet.findMany({
      where: {
        asset: {
          vaultId: vault.id,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Crypto wallets fetched successfully",
      data: cryptoWallets,
    });
  } catch (error) {
    console.error("Get Crypto Wallets Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export { addCryptoWallet, getCryptoWallets };
