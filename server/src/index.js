import env from "dotenv";
import express from "express";
import { db } from "./db/db.js";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";

env.config();

console.log("Connecting to DB at:", process.env.PG_HOST, process.env.PG_PORT);

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// EXPRESS-SESSION SETUP //
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 600000 },
  })
);

// 👇 Add error handling for DB connection
db.connect()
  .then(() => {
    console.log("✅ Connected to the database");
    app.listen(port, () => {
      console.log(`🚀 Server is running on cryptoVault. Port ${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to the database:", err.message);
    process.exit(1); // Exit with failure
  });

// Import routes
import homeRouter from "./routes/home.router.js";
import authRouter from "./routes/auth.router.js";
import vaultRouter from "./routes/vault.router.js";
import assetRouter from "./routes/asset.router.js";
import heirAuthRouter from "./routes/heir.auth.router.js";
import userRouter from "./routes/user.router.js";
// import heirRouter from "./routes/heir.router.js";

// Use routes
app.use("/", homeRouter);
app.use("/auth", authRouter);
app.use("/dashboard/vault", vaultRouter);
app.use("/dashboard/vault/asset", assetRouter);
app.use("/dashboard/vault/asset", assetRouter);
app.use("/heir/auth", heirAuthRouter);
app.use("/user", userRouter);
// app.use("/dashboard/heir", heirRouter);
