import env from "dotenv";
import nodemailer from "nodemailer";

env.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL, // change sending email later
    pass: process.env.NODEMAILER_EMAIL_PASSWORD,
  },
});

export { transporter };
