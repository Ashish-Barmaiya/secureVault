import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  createVault,
  unlockVault,
  getLivenessStatus,
} from "../controllers/vault.controller.js";
import {
  generateChallenge,
  submitAttestation,
  reportFailure,
} from "../controllers/challenge.controller.js";

const router = express.Router();

// Vault CRUD operations
router.post("/create-vault", auth, createVault);
router.get("/unlock-vault", auth, unlockVault);

// Dead Man's Switch - VUA endpoints
router.post("/challenge", auth, generateChallenge);
router.post("/unlock-attestation", auth, submitAttestation);
router.post("/unlock-failed", auth, reportFailure);
router.get("/liveness-status", auth, getLivenessStatus);

export default router;
