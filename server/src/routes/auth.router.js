import express from "express";
import {
  initializeUserSignUp,
  verifyOtpAndCreateNewUser,
  userLogin,
  refreshAccessToken,
  googleAuth,
  googleAuthCallback,
  setupTwoFactorAuth,
  verifyTwoFactorCode,
} from "../controllers/auth.controller.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// user sign-up intialization route
router.post("/sign-up", initializeUserSignUp);

// User OTP verification and completing sign-up route
router.post("/verify-otp", verifyOtpAndCreateNewUser);

// User google oAuth routes
router.get("/auth/google", googleAuth);
router.get("/auth/google/callback", googleAuthCallback);

// User login route
router.post("/login", userLogin);

// Refresh access token route
router.post("/refresh-token", refreshAccessToken);

// User logout route
router.post("/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return res.status(200).json({
    success: true,
    message: "User logged out successfully",
  });
});

// User 2FA setup route
router.post("/2fa/setup", auth, setupTwoFactorAuth);

// User 2FA verification route
router.post("/2fa/verify", auth, verifyTwoFactorCode);

// User 2FA reset route

export default router;
