import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  addCryptoWallet,
  getCryptoWallets,
} from "../controllers/asset.controller.js";

const router = express.Router();

router.post("/add-crypto-wallet", auth, addCryptoWallet);

router.get("/crypto-wallet", auth, getCryptoWallets);

export default router;
