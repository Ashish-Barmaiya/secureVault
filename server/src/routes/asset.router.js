import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  createAsset,
  getAssets,
  updateAsset,
  deleteAsset,
  logReveal,
  logHide,
} from "../controllers/asset.controller.js";

const router = express.Router();

// CRUD
router.post("/", auth, createAsset);
router.get("/", auth, getAssets);
router.put("/:id", auth, updateAsset);
router.delete("/:id", auth, deleteAsset);

// Audit Logging for Client-side Actions
router.post("/:id/reveal", auth, logReveal);
router.post("/:id/hide", auth, logHide);

export default router;
