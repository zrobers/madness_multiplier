// server.js
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
dotenv.config();

import authRoutes from "./routes/authenticateRoutes.js";
import gamesRoutes from "./routes/gamesRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import poolsRoutes from "./routes/poolsRoutes.js";
import wagersRoutes from "./routes/wagersRoutes.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// DEV auth shim: set req.user.id (UUID string) via header
app.use((req, _res, next) => {
  if (process.env.DEV_AUTH === "true") {
    const u = req.header("X-User-Id");
    if (u) req.user = { id: u }; // UUID
  }
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/leaderboard", leaderboardRoutes);        // GET /api/leaderboard?poolId=UUID
app.use("/api/pools", poolsRoutes); // GET /api/pools/:poolId
app.use("/api/games", gamesRoutes);                    // GET /api/games?season=2024
app.use("/api/wagers", wagersRoutes);                                       // POST /api/wagers

app.use("/api/auth", authRoutes);

app.listen(process.env.PORT || 4000, () =>
  console.log(`API listening on :${process.env.PORT || 4000}`)
);