// routes/userRoutes.js
import express from "express";
import { query } from "../db.js";

const router = express.Router();

// Add a new user in Postgres after Firebase login/register
router.post("/", async (req, res) => {
  const { uid, email, role } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ error: "Missing uid or email" });
  }

  try {
    await query(
      "INSERT INTO users (firebase_uid, email, role) VALUES ($1, $2, $3) ON CONFLICT (firebase_uid) DO NOTHING",
      [uid, email, role || "basic"]
    );
    res.status(201).json({ message: "User saved in Postgres" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
