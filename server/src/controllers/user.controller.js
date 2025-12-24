import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Link Heir
export const linkHeir = async (req, res) => {
  const userId = req.user.id;
  const { email } = req.body;

  try {
    // Find heir by email
    const heir = await prisma.heir.findFirst({ where: { email } });

    if (!heir) {
      return res.status(404).json({ success: false, message: "Heir not found" });
    }

    if (heir.userId) {
      return res.status(400).json({ success: false, message: "Heir already linked to a user" });
    }

    // Link heir
    await prisma.heir.update({
      where: { id: heir.id },
      data: { userId },
    });

    return res.status(200).json({ success: true, message: "Heir linked successfully", heir });
  } catch (error) {
    console.error("Error linking heir:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Linked Heirs
export const getLinkedHeirs = async (req, res) => {
  const userId = req.user.id;

  try {
    const heirs = await prisma.heir.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        publicKey: true,
        createdAt: true,
      },
    });

    return res.status(200).json({ success: true, heirs });
  } catch (error) {
    console.error("Error fetching heirs:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
