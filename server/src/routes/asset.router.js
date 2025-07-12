import express from "express";
import { auth } from "../middlewares/auth.js";
import { addCryptoWallet } from "../controllers/asset.controller.js";

const router = express.Router();

router.post("/add-crypto-wallet", auth, addCryptoWallet);

export default router;
