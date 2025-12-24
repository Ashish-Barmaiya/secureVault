import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import qrCode from "qrcode";
import { sendOtpViaEmail } from "../utils/otp.js";
import { generateTokens } from "../utils/generateTokens.js"; // Ensure this handles 'role' or we need a new one
import { logActivity } from "../utils/logActivity.js"; // Optional: log heir activity?
import { encryptVaultKey } from "../utils/encryptVaultKey.js";

const prisma = new PrismaClient();
const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;

// 1. Initialize Heir Sign Up (Send OTP to email)
export const initializeHeirSignUp = async (req, res) => {
  const { email, password, name } = req.body;

  // Store data in session (similar to user auth)
  req.session.heirDataInSession = { email, password, name };

  try {
    // Check if heir already exists and is fully registered (has password)
    const existingHeir = await prisma.heir.findFirst({
      where: { email },
    });

    if (existingHeir && existingHeir.passwordHash) {
      return res
        .status(400)
        .json({ success: false, message: "Heir email already registered" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Send OTP
    const sent = await sendOtpViaEmail(email, otp);
    if (!sent) {
      return res.status(500).json({ success: false, message: "Error sending email" });
    }

    // Store OTP in session
    req.session.heirOtpData = {
      otp,
      expiresAt: Date.now() + 15 * 60 * 1000,
    };

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully via Email",
      email,
    });
  } catch (error) {
    console.error("Error initializing heir signup:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Verify OTP and Create/Update Heir
export const verifyHeirOtpAndCreate = async (req, res) => {
  const { otp } = req.body;
  const otpData = req.session.heirOtpData;
  const heirData = req.session.heirDataInSession;

  if (!otpData || !heirData) {
    return res.status(400).json({ success: false, message: "Session expired or invalid" });
  }

  if (Date.now() > otpData.expiresAt) {
    return res.status(400).json({ success: false, message: "OTP expired" });
  }

  if (Number(otp) !== otpData.otp) {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }

  try {
    const hashedPassword = await bcrypt.hash(heirData.password, saltRounds);

    // Check if heir exists (invited)
    let heir = await prisma.heir.findFirst({ where: { email: heirData.email } });

    if (heir) {
      // Update existing heir
      heir = await prisma.heir.update({
        where: { id: heir.id },
        data: {
          passwordHash: hashedPassword,
          name: heirData.name, // Update name if provided
        },
      });
    } else {
      // Create new heir (Independent signup)
      heir = await prisma.heir.create({
        data: {
          email: heirData.email,
          passwordHash: hashedPassword,
          name: heirData.name,
          relationship: "Pending", // Default until linked
          // userId is null
        },
      });
    }

    // Clear session
    req.session.heirOtpData = null;
    req.session.heirDataInSession = null;

    return res.status(201).json({
      success: true,
      message: "Heir registered successfully",
      heir: { id: heir.id, email: heir.email, name: heir.name },
    });
  } catch (error) {
    console.error("Error verifying heir OTP:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Heir Login
export const heirLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const heir = await prisma.heir.findFirst({ where: { email } });
    if (!heir || !heir.passwordHash) {
      return res.status(404).json({ success: false, message: "Heir not found" });
    }

    const isMatch = await bcrypt.compare(password, heir.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    // Generate tokens (Assuming generateTokens handles payload structure or we manually do it)
    // If generateTokens expects a user object with id and email:
    const tokens = generateTokens({ id: heir.id, email: heir.email, role: "heir" }); 
    // Note: generateTokens implementation in utils might need adjustment if it strictly expects 'user' role or similar. 
    // But usually it just signs the payload. I'll assume it works or I'll check it.

    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000,
    });
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Heir logged in",
      heir: {
        id: heir.id,
        email: heir.email,
        name: heir.name,
        isVerified: heir.isVerified,
        twoFactorEnabled: heir.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error("Error logging in heir:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Heir Logout
export const heirLogout = async (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return res.status(200).json({ success: true, message: "Logged out" });
};

// 5. Verify Heir & Generate Keys (Crypto Verification)
export const verifyHeirAndGenerateKeys = async (req, res) => {
  const heirId = req.user?.id;
  if (!heirId) return res.status(401).json({ message: "Unauthorized" });

  const { publicKey, encryptedPrivateKey, salt } = req.body;

  if (!publicKey || !encryptedPrivateKey || !salt) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    // Server-side encryption for the private key (Double Encryption)
    // The private key is already encrypted by the client with the Heir's Master Key.
    // We encrypt it again with the Server Secret for storage security.
    const { ciphertext, iv } = encryptVaultKey(encryptedPrivateKey);
    const serverEncryptedPrivateKey = JSON.stringify({ ciphertext, iv });

    await prisma.heir.update({
      where: { id: heirId },
      data: {
        publicKey,
        encryptedPrivateKey: serverEncryptedPrivateKey,
        salt,
        isVerified: true, // Mark as verified now that keys are set up
      },
    });

    return res.status(200).json({ success: true, message: "Heir verified and keys stored successfully" });
  } catch (error) {
    console.error("Error verifying heir keys:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Setup 2FA
export const setupHeirTwoFactor = async (req, res) => {
  const heirId = req.user?.id;
  if (!heirId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const heir = await prisma.heir.findUnique({ where: { id: heirId } });
    if (heir.twoFactorEnabled) {
      return res.status(400).json({ success: false, message: "2FA already enabled" });
    }

    const secret = speakeasy.generateSecret({ name: "SecureVault Heir", length: 20 });
    
    // Save secret temporarily or permanently? User flow saves it.
    await prisma.heir.update({
      where: { id: heirId },
      data: { twoFactorSecret: secret.base32 },
    });

    const qrCodeUrl = await qrCode.toDataURL(secret.otpauth_url);

    return res.status(200).json({
      success: true,
      message: "2FA setup initiated",
      qrCodeUrl,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Verify 2FA
export const verifyHeirTwoFactor = async (req, res) => {
  const heirId = req.user?.id;
  const { token } = req.body;

  try {
    const heir = await prisma.heir.findUnique({ where: { id: heirId } });
    if (!heir || !heir.twoFactorSecret) {
      return res.status(400).json({ success: false, message: "2FA not setup" });
    }

    const isVerified = speakeasy.totp.verify({
      secret: heir.twoFactorSecret,
      encoding: "base32",
      token,
      window: 5,
    });

    if (!isVerified) {
      return res.status(400).json({ success: false, message: "Invalid 2FA code" });
    }

    await prisma.heir.update({
      where: { id: heirId },
      data: { twoFactorEnabled: true },
    });

    return res.status(200).json({ success: true, message: "2FA enabled" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
// 8. Get Current Heir Info
export const getHeirMe = async (req, res) => {
  const heirId = req.user?.id;
  if (!heirId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const heir = await prisma.heir.findUnique({
      where: { id: heirId },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        twoFactorEnabled: true,
        accessLevel: true,
      },
    });

    if (!heir) return res.status(404).json({ success: false, message: "Heir not found" });

    return res.status(200).json({ success: true, heir });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
