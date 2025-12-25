import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Link Heir
// Search Heir
export const searchHeir = async (req, res) => {
  const { email } = req.body;

  try {
    const heir = await prisma.heir.findFirst({ where: { email } });

    if (!heir) {
      return res
        .status(404)
        .json({ success: false, message: "Heir not found" });
    }

    if (heir.userId) {
      return res.status(400).json({
        success: false,
        message: "Heir already linked to another user",
      });
    }

    if (heir.linkStatus === "PENDING") {
      // Check if it's pending for THIS user or another
      // Ideally we should check heir.userId but it's null if pending?
      // Wait, if pending, we need to know WHO it is pending for.
      // The schema says `userId String?`. So if we set userId during request, we can check it.
      // But if we set userId, then `heir.userId` check above might trigger.
      // Let's refine the logic:
      // If userId is set AND linkStatus is LINKED -> Already linked.
      // If userId is set AND linkStatus is PENDING -> Pending request.
      // So, let's check:
      /*
      if (heir.userId && heir.linkStatus === 'LINKED') {
          return res.status(400).json({ ... message: "Already linked" });
      }
      if (heir.userId && heir.linkStatus === 'PENDING') {
          if (heir.userId === req.user.id) {
             return res.status(200).json({ success: true, status: "PENDING_CONFIRMATION", heir: { name: heir.name, email: heir.email } });
          } else {
             return res.status(400).json({ ... message: "Heir has a pending request from another user" });
          }
      }
      */
      // But wait, the original code checked `if (heir.userId)`.
      // I need to update that check to be aware of status.
    }

    // Actually, let's rewrite the logic cleanly.

    if (heir.userId) {
      if (heir.linkStatus === "LINKED") {
        return res.status(400).json({
          success: false,
          message: "Heir already linked to another user",
        });
      }
      if (heir.linkStatus === "PENDING") {
        if (heir.userId === req.user.id) {
          return res.status(200).json({
            success: true,
            status: "PENDING",
            heir: { name: heir.name, email: heir.email },
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "Heir is busy with another request",
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      status: "AVAILABLE",
      heir: { name: heir.name, email: heir.email },
    });
  } catch (error) {
    console.error("Error searching heir:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Request Link Heir
export const requestLinkHeir = async (req, res) => {
  const userId = req.user.id;
  const { email, relationship } = req.body;

  try {
    const heir = await prisma.heir.findFirst({ where: { email } });

    if (!heir) {
      return res
        .status(404)
        .json({ success: false, message: "Heir not found" });
    }

    if (heir.userId && heir.linkStatus === "LINKED") {
      return res
        .status(400)
        .json({ success: false, message: "Heir already linked" });
    }

    if (heir.userId && heir.userId !== userId) {
      return res
        .status(400)
        .json({ success: false, message: "Heir unavailable" });
    }

    // Update heir with userId and PENDING status
    await prisma.heir.update({
      where: { id: heir.id },
      data: {
        userId,
        linkStatus: "PENDING",
        relationship: relationship || heir.relationship, // Update relationship if provided
      },
    });

    // TODO: Send notification/email to Heir

    return res
      .status(200)
      .json({ success: true, message: "Linking request sent" });
  } catch (error) {
    console.error("Error requesting link:", error);
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
        linkStatus: true,
        createdAt: true,
      },
    });

    return res.status(200).json({ success: true, heirs });
  } catch (error) {
    console.error("Error fetching heirs:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
