// server.js
import dotenv from "dotenv"; dotenv.config();
import express from "express"; import cors from "cors"; import helmet from "helmet";

import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import wagersRoutes from "./routes/wagersRoutes.js";
import authRoutes from "./routes/authRoutes.js";

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
app.use("/api/wagers", (req, res, next) => {
  if (!req.user?.id) return res.status(401).json({ error: "Unauthenticated" });
  next();
}, wagersRoutes);                                       // POST /api/wagers

app.use("/api/auth", authRoutes);

app.listen(process.env.PORT || 4000, () =>
  console.log(`API listening on :${process.env.PORT || 4000}`)
);