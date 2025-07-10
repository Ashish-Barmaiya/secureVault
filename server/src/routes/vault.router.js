import express from "express";
import { auth } from "../middlewares/auth.js";
import { createVault, unlockVault } from "../controllers/vault.controller.js";

const router = express.Router();

router.post("/create-vault", auth, createVault);

router.get("/unlock-vault", auth, unlockVault);

export default router;
