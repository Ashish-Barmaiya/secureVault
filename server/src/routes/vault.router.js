import express from "express";
import { auth } from "../middlewares/auth.js";
import { createVault } from "../controllers/vault.controller.js";

const router = express.Router();

router.post("/create-vault", auth, createVault);

export default router;
