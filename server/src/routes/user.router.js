import express from "express";
import {
  // linkHeir,
  getLinkedHeirs,
  searchHeir,
  requestLinkHeir,
} from "../controllers/user.controller.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// Link Heir
// Search Heir
router.post("/search-heir", auth, searchHeir);

// Request Link Heir
router.post("/request-link-heir", auth, requestLinkHeir);

// Link Heir (Deprecated/Internal use only?) - keeping for now but logic moved to request
// router.post("/link-heir", auth, linkHeir);

// Get Linked Heirs
router.get("/heirs", auth, getLinkedHeirs);

export default router;
