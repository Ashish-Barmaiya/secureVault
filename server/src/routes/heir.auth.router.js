import express from "express";
import {
  initializeHeirSignUp,
  verifyHeirOtpAndCreate,
  heirLogin,
  heirLogout,
  verifyHeirAndGenerateKeys,
  setupHeirTwoFactor,
  verifyHeirTwoFactor,
  getHeirMe,
} from "../controllers/heir.auth.controller.js";
import { auth } from "../middlewares/auth.js"; // We might need a specific heir auth middleware or reuse this

const router = express.Router();

// Get Current Heir
router.get("/me", auth, getHeirMe);

// Heir sign-up initialization
router.post("/sign-up", initializeHeirSignUp);

// Heir OTP verification and creation
router.post("/verify-otp", verifyHeirOtpAndCreate);

// Heir Login
router.post("/login", heirLogin);

// Heir Logout
router.post("/logout", heirLogout);

// Heir Verification (Master Password & Key Generation)
// This likely needs authentication (Heir must be logged in)
// Heir Verification (Master Password & Key Generation)
// This likely needs authentication (Heir must be logged in)
router.post("/verify-keys", auth, verifyHeirAndGenerateKeys);

// Heir 2FA Setup
// Heir 2FA Setup
router.post("/2fa/setup", auth, setupHeirTwoFactor);

// Heir 2FA Verify
router.post("/2fa/verify", auth, verifyHeirTwoFactor);

export default router;
