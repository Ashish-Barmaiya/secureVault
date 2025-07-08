import env from "dotenv";
import { transporter } from "./nodemailer.js";

env.config();

// SEND OTP FOR EMAIL VERIFICATION //
const sendOtpViaEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.NODEMAILER_EMAIL,
    to: email,
    subject: "Your OTP for Verification",
    html: `<p>Your OTP for verification is <strong>${otp}</strong>. It is valid for 15 minutes.</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.response);
    return true;
  } catch (error) {
    console.error("Error sending email: ", error);
    return false;
  }
};

export { sendOtpViaEmail };
