import express from "express";
import { auth } from "../middlewares/auth.js"; // Ensure this works for heirs or use heirAuth
import {
  initiateClaim,
  submitClaim,
  getHeirAssets,
} from "../controllers/heir.vault.controller.js";

const router = express.Router();

// All routes require authentication
// Note: 'auth' middleware usually checks for 'user' in session/token.
// We need to ensure it supports heirs or use a specific heir middleware.
// Based on heir.router.js, it uses 'auth'. Let's assume 'auth' handles both or checks generic token.
router.post("/initiate", auth, initiateClaim);
router.post("/claim", auth, submitClaim);
router.get("/assets", auth, getHeirAssets);

export default router;
