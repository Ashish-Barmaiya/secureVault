import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  initializeCreateHeir,
  verifyHeir,
  getPendingRequests,
  respondToLinkRequest,
} from "../controllers/heir.controller.js";

const router = express.Router();

// Legacy/User actions?
router.post("/create-heir", auth, initializeCreateHeir);
router.post("/verify-heir", auth, verifyHeir);

// Heir actions
router.get("/pending-requests", auth, getPendingRequests);
router.post("/respond-link-request", auth, respondToLinkRequest);

export default router;
