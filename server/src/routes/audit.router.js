import express from "express";
import { getAuditLogs } from "../controllers/audit.controller.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// Apply auth middleware
router.use(auth);

router.get("/logs", getAuditLogs);

export default router;
