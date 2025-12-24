import express from "express";
import { linkHeir, getLinkedHeirs } from "../controllers/user.controller.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// Link Heir
router.post("/link-heir", auth, linkHeir);

// Get Linked Heirs
router.get("/heirs", auth, getLinkedHeirs);

export default router;
