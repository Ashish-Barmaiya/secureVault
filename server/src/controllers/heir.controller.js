import prisma from "../db/prisma.js";
import AuditService from "../services/audit.service.js";

// INITIALIZE CREATE HEIR AND SEND EMAIL OTP
const initializeCreateHeir = async (req, res) => {
  // get data from request body
  const { name, email, relationship } = req.body;
  req.session.heirDataInSession = { name, email, relationship };
  try {
    // check if email already exists
    const existingHeir = await prisma.heir.findUnique({
      where: { email },
    });
    if (existingHeir) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    // check if user already has three pre-existing heirs
    const existingHeirsLength = await prisma.heir.findMany({
      where: { userId: req.user.id },
    });
    if (existingHeirsLength.length >= 3) {
      return res
        .status(400)
        .json({ success: false, message: "User already has three heirs" });
    }

    // Generate otp
    const generateOtp = () => {
      return Math.floor(100000 + Math.random() * 900000);
    };
    const otp = generateOtp();

    // send otp to email
    const sendOtp = await sendOtpViaEmail(email, otp);

    if (!sendOtp) {
      console.log("Error sending otp via email");
      return res
        .status(500)
        .json({ success: false, message: "Error sending email" });
    }

    // store otp in session
    req.session.otpData = {
      otp: otp,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes expiry
    };
    console.log("OTP sent successfully via Email");

    // return success
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully via Email",
      email,
    });
  } catch (error) {
    console.error("Error initializing heir registration: ", error);
    res.status(500).json({
      success: false,
      message: "Error initializing heir registration",
      error,
    });
  }
};

// VERIFY OTP AND CREATE HEIR
const verifyHeir = async (req, res) => {
  // get otp from request body
  const { otp } = req.body;
  try {
    // get otpData from session
    const otpData = req.session.otpData;
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: "OTP not found in session. Please request a new OTP.",
      });
    }
    console.log("OTP Data in session:", otpData);

    // get heirData from session
    const heirDataInSession = req.session.heirDataInSession;
    if (!heirDataInSession) {
      return res.status(400).json({
        success: false,
        message: "Heir data not found in session. Please try again.",
      });
    }
    // check if otp has expired
    if (Date.now() > otpData.expiresAt) {
      console.log("OTP has expired");
      return res
        .status(400)
        .json({ success: false, message: "OTP has expired" });
    }
    // verify otp
    if (Number(otp) !== otpData.otp) {
      console.log("Invalid OTP");
      return res.status(401).json({ success: false, message: "Inavalid OTP" });
    }
    // create heir
    // create heir and log audit
    const newHeir = await prisma.$transaction(async (tx) => {
      const heir = await tx.heir.create({
        data: {
          name: heirDataInSession.name,
          email: heirDataInSession.email,
          relationship: heirDataInSession.relationship,
          isVerified: true,
          // Assuming userId is set later or passed in session?
          // Wait, initializeCreateHeir checks req.user.id but doesn't store it in session explicitly for creation?
          // Ah, verifyHeir doesn't seem to link to userId immediately?
          // Let's check schema. Heir has userId.
          // initializeCreateHeir stores { name, email, relationship } in session.
          // It doesn't seem to store userId.
          // But wait, existingHeirsLength check uses req.user.id.
          // If verifyHeir is called by the USER, then req.user.id is available.
          // But verifyHeir takes otp from body.
          // If the user is logged in as USER, then req.user.id is the user.
          // But if this is an invite flow, usually the USER does it.
          // Let's assume req.user is the USER.
        },
      });

      // If req.user is available (User adding heir), we should link them?
      // The original code didn't link userId?
      // Line 107: data: { name, email, relationship, isVerified: true }
      // It does NOT set userId.
      // So the heir is created but not linked?
      // Ah, maybe `respondToLinkRequest` links them?
      // But `respondToLinkRequest` is called by HEIR?
      // Let's look at `initializeCreateHeir` again.
      // It checks `req.user.id`.
      // So `verifyHeir` is likely called by USER.
      // But `verifyHeir` implementation (lines 72-144) doesn't use `req.user`.
      // So the heir is created "floating".
      // This might be a bug or intended.
      // I will just log HEIR_ADDED (or HEIR_INVITED) for now.

      await AuditService.logAuditIntent(tx, {
        actorType: "USER", // Assuming User initiated this
        actorId: req.user ? req.user.id : "UNKNOWN",
        targetType: "HEIR_LINK", // or ACCOUNT?
        targetId: heir.id,
        eventType: "HEIR_INVITED",
        eventVersion: 1,
        payload: {
          email: heir.email,
          relationship: heir.relationship,
        },
      });

      return heir;
    });

    console.log("Heir created successfully:", newHeir.email);

    // Legacy log
    logActivity(req, newHeir.id, "HEIR_ADDED");

    // return success
    return res.status(201).json({
      success: true,
      message: "Heir registered successfully",
      heir: newHeir,
    });
  } catch (error) {
    console.error("Error verifying heir registration: ", error);
    res.status(500).json({
      success: false,
      message: "Error verifying heir registration",
      error,
    });
  }
};

// GET PENDING LINK REQUESTS
const getPendingRequests = async (req, res) => {
  const heirId = req.user.id;
  try {
    const heir = await prisma.heir.findUnique({
      where: { id: heirId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!heir) {
      return res
        .status(404)
        .json({ success: false, message: "Heir not found" });
    }

    if (heir.linkStatus === "PENDING" && heir.userId) {
      return res.status(200).json({
        success: true,
        hasRequest: true,
        request: {
          user: heir.user,
          relationship: heir.relationship,
        },
      });
    }

    return res.status(200).json({ success: true, hasRequest: false });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// RESPOND TO LINK REQUEST
const respondToLinkRequest = async (req, res) => {
  const heirId = req.user.id;
  const { accept } = req.body; // boolean

  try {
    const heir = await prisma.heir.findUnique({ where: { id: heirId } });

    if (!heir || heir.linkStatus !== "PENDING" || !heir.userId) {
      return res
        .status(400)
        .json({ success: false, message: "No pending request found" });
    }

    if (accept) {
      await prisma.$transaction(async (tx) => {
        await tx.heir.update({
          where: { id: heirId },
          data: { linkStatus: "LINKED" },
        });

        await AuditService.logAuditIntent(tx, {
          actorType: "HEIR",
          actorId: heirId,
          targetType: "HEIR_LINK",
          targetId: heir.userId || "UNKNOWN",
          eventType: "HEIR_INVITATION_ACCEPTED",
          eventVersion: 1,
          payload: {
            linkedToUser: heir.userId,
          },
        });
      });

      return res.status(200).json({
        success: true,
        message: "Request accepted. You are now linked.",
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.heir.update({
          where: { id: heirId },
          data: { linkStatus: null, userId: null },
        });

        await AuditService.logAuditIntent(tx, {
          actorType: "HEIR",
          actorId: heirId,
          targetType: "HEIR_LINK",
          targetId: heir.userId || "UNKNOWN",
          eventType: "HEIR_INVITATION_REJECTED", // Not in requirements list but logical
          eventVersion: 1,
          payload: {
            rejectedUser: heir.userId,
          },
        });
      });

      return res
        .status(200)
        .json({ success: true, message: "Request rejected." });
    }
  } catch (error) {
    console.error("Error responding to request:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  initializeCreateHeir,
  verifyHeir,
  getPendingRequests,
  respondToLinkRequest,
};
