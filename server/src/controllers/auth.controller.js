import env from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import speakeasy from "speakeasy";
import qrCode from "qrcode";
import { sendOtpViaEmail } from "../utils/otp.js";
import { generateTokens } from "../utils/generateTokens.js";
import { logActivity } from "../utils/logActivity.js";
import { santizeUserDataForDashboard } from "../utils/santizeUserDataForDashboard.js";

env.config();
const saltRounds = parseInt(process.env.SALT_ROUNDS);
const prisma = new PrismaClient();

const initializeUserSignUp = async (req, res) => {
  // get data from request body
  const { email, password } = req.body;

  // store user data in session
  req.session.userDataInSession = { email, password };

  try {
    // check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
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
    console.error("Error initializing user registration: ", error);
    res.status(500).json({
      success: false,
      message: "Error initializing user registration",
      error,
    });
  }
};

// VERIFY OTP AND CREATE NEW USER
const verifyOtpAndCreateNewUser = async (req, res) => {
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

    // get userData from session
    const userDataInSession = req.session.userDataInSession;
    if (!userDataInSession) {
      return res.status(400).json({
        success: false,
        message: "User data not found in session. Please try again.",
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
    // hash password
    const hashedPassword = await bcrypt.hash(
      userDataInSession.password,
      saltRounds
    );
    // create new user
    const newUser = await prisma.user.create({
      data: {
        email: userDataInSession.email,
        passwordHash: hashedPassword,
      },
    });
    if (!newUser) {
      return res
        .status(500)
        .json({ success: false, message: "Error creating new user" });
    }
    console.log("New user created successfully:", newUser.email);

    // Create activity log for ACCOUNT_CREATED
    logActivity(req, newUser.id, "ACCOUNT_CREATED");
    if (logActivity) {
      console.log("Activity logged successfully for user:", newUser.id);
    } else {
      console.error("Failed to log activity for user:", newUser.id);
    }

    // return success
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Error verifying OTP and creating new user: ", error);
    res.status(500).json({
      success: false,
      message: "Error verifying OTP and creating new user",
      error,
    });
  }
};

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost/user/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists in the database
        let user = await user.findOne({ googleId: profile.id });
        if (!user) {
          // Create a new user if not found
          user = await user.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Serialize and deserialize user for session handling
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await user.findById(id);
  done(null, user);
});

// Google authentication route
const googleAuth = (req, res, next) => {
  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next
  );
};

// Google callback route
const googleAuthCallback = (req, res, next) => {
  passport.authenticate("google", { failureRedirect: "/" }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: "Authentication failed" });
    }
    // Generate JWT token for the user
    const token = generateTokens(user);
    res.json({ token, message: "Google sign-in successful" });
  })(req, res, next);
};

// USER LOGIN
const userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    // generate tokens
    const tokens = generateTokens(user);

    // set tokens in cookies
    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    console.log("User logged in successfully:", user.email);

    //Safe user data to send in response
    const safeUser = santizeUserDataForDashboard(user);

    // return success
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("Error logging in user: ", error);
    res.status(500).json({
      success: false,
      message: "Error logging in user",
      error,
    });
  }
};

// REFRESH ACCESS TOKEN
const refreshAccessToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token" });

  try {
    console.log("Received refresh token:", refreshToken);

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 15 * 60 * 1000, // 2 hours
    });

    return res.status(200).json({ success: true, message: "Token refreshed" });
  } catch (err) {
    console.error("JWT verification error:", err.message);
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }
};

// 2FA SETUP
const setupTwoFactorAuth = async (req, res) => {
  const userId = req.user.id;
  console.log("user:" + req.user);

  try {
    // Check if user already has a 2FA secret
    const twoFactorAlreadyExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    if (twoFactorAlreadyExists.twoFactorEnabled) {
      console.log("2FA already set up for user:", userId);
      return res.status(400).json({
        success: false,
        message: "2FA is already set up for this user",
      });
    }

    // Generate a secret for 2FA
    const secret = speakeasy.generateSecret({
      name: "cryptoValut",
      length: 20,
    });

    console.log("Generated 2FA secret:", secret);

    // Generate a provisioning URI for the secret
    secret.otpauth_url = speakeasy.otpauthURL({
      secret: secret.base32,
      label: `cryptoVault:${req.user.email}`,
      issuer: "cryptoVault",
      encoding: "base32",
    });

    // Generate a QR code for the secret
    const qrCodeUrl = await qrCode.toDataURL(secret.otpauth_url);

    // Save the secret to the user's profile in the database
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    return res.status(200).json({
      success: true,
      message: "2FA setup successful",
      qrCodeUrl,
    });
  } catch (error) {
    console.error("Error setting up 2FA:", error);
    return res.status(500).json({
      success: false,
      message: "Error setting up 2FA",
      error,
    });
  }
};

// VERIFY 2FA CODE
const verifyTwoFactorCode = async (req, res) => {
  // Get token from request body
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "2FA token is required",
    });
  }
  // Ensure the user is authenticated
  const userId = req.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) {
    return res.status(404).json({
      success: false,
      message: "2 Factor Authentication is not set up for this user",
    });
  }

  try {
    // Verify token
    const isVerified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 1, // 30s drift window
    });

    console.log("2FA verification result:", isVerified);

    if (!isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid 2FA code" });
    }

    // If verified, update user's 2FA status
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    // Return success
    return res.status(200).json({ success: true, message: "2FA verified" });
  } catch (error) {
    console.error("Error verifying 2FA code:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying 2FA code",
      error,
    });
  }
};

export {
  initializeUserSignUp,
  verifyOtpAndCreateNewUser,
  userLogin,
  refreshAccessToken,
  googleAuth,
  googleAuthCallback,
  setupTwoFactorAuth,
  verifyTwoFactorCode,
};
