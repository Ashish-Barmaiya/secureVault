const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto");

// Search for an heir by email
exports.searchHeir = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const heir = await prisma.heir.findFirst({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        userId: true, // To check if already linked
      },
    });

    if (!heir) {
      return res
        .status(404)
        .json({ success: false, message: "Heir not found" });
    }

    if (heir.userId) {
      return res.status(400).json({
        success: false,
        message: "Heir is already linked to a user",
        isLinked: true,
      });
    }

    // Check if there's already a pending request from this user
    const existingRequest = await prisma.heirConnectionRequest.findUnique({
      where: {
        userId_heirId: {
          userId: req.user.userId,
          heirId: heir.id,
        },
      },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Request already sent",
        requestStatus: existingRequest.status,
      });
    }

    return res.status(200).json({ success: true, heir });
  } catch (error) {
    console.error("Search Heir Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Send a connection request to an heir
exports.sendRequest = async (req, res) => {
  try {
    const { heirId, relationship } = req.body;
    const userId = req.user.userId;

    if (!heirId) {
      return res
        .status(400)
        .json({ success: false, message: "Heir ID is required" });
    }

    // Verify heir exists and is not linked
    const heir = await prisma.heir.findUnique({
      where: { id: heirId },
    });

    if (!heir) {
      return res
        .status(404)
        .json({ success: false, message: "Heir not found" });
    }

    if (heir.userId) {
      return res
        .status(400)
        .json({ success: false, message: "Heir is already linked" });
    }

    // Create request
    const request = await prisma.heirConnectionRequest.create({
      data: {
        userId,
        heirId,
        status: "PENDING",
      },
    });

    // Optionally update relationship if provided (though usually stored in Heir model,
    // but Heir model is created by Heir? No, Heir model is created by Heir registration.
    // The relationship field in Heir model is currently just a string.
    // We might want to update it when the link is finalized, or store it in the request if needed.
    // For now, let's assume we update it on acceptance or just ignore if not in schema.)

    return res
      .status(201)
      .json({ success: true, message: "Request sent successfully", request });
  } catch (error) {
    console.error("Send Request Error:", error);
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ success: false, message: "Request already exists" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Get pending requests for an heir
exports.getPendingRequests = async (req, res) => {
  try {
    const heirId = req.heir.heirId; // Assuming heir auth middleware adds this

    const requests = await prisma.heirConnectionRequest.findMany({
      where: {
        heirId,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error("Get Pending Requests Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Respond to a connection request (Accept/Reject)
exports.respondToRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body; // action: 'ACCEPT' or 'REJECT'
    const heirId = req.heir.heirId;

    if (!["ACCEPT", "REJECT"].includes(action)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    const request = await prisma.heirConnectionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    if (request.heirId !== heirId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (request.status !== "PENDING") {
      return res
        .status(400)
        .json({ success: false, message: "Request is not pending" });
    }

    if (action === "REJECT") {
      await prisma.heirConnectionRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" },
      });
      return res
        .status(200)
        .json({ success: true, message: "Request rejected" });
    }

    // If ACCEPT
    // Transaction to update request status and link heir to user
    await prisma.$transaction(async (tx) => {
      // 1. Update request status
      await tx.heirConnectionRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED" },
      });

      // 2. Link Heir to User
      await tx.heir.update({
        where: { id: heirId },
        data: {
          userId: request.userId,
          // We could update relationship here if we passed it in the request or stored it
        },
      });
    });

    return res
      .status(200)
      .json({
        success: true,
        message: "Request accepted and linked successfully",
      });
  } catch (error) {
    console.error("Respond Request Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
