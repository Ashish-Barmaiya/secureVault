import { PrismaClient } from "@prisma/client";
import { logActivity } from "../utils/logActivity.js";

const prisma = new PrismaClient();

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
}

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
        const newHeir = await prisma.heir.create({
            data: {
                name: heirDataInSession.name,
                email: heirDataInSession.email,
                relationship: heirDataInSession.relationship,
                isVerified: true,
            },
        });
        if (!newHeir) {
            return res
                .status(500)
                .json({ success: false, message: "Error creating heir" });
        }
        console.log("Heir created successfully:", newHeir.email);

        // Create activity log for ACCOUNT_CREATED
        logActivity(req, newHeir.id, "ACCOUNT_CREATED");
        if (logActivity) {
            console.log("Activity logged successfully for heir:", newHeir.id);
        } else {
            console.error("Failed to log activity for heir:", newHeir.id);
        }

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
}


export { initializeCreateHeir, verifyHeir };