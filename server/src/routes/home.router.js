import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the Home Page of CryptoVault",
    status: "success",
  });
});

export default router;
