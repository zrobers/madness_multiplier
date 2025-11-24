import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/check-handle", async (req, res) => {
  const { handle } = req.body;

  try {
    const result = await pool.query(
      `SELECT 1 FROM mm.users WHERE handle = $1`,
      [handle]
    );

    res.json({ available: result.rowCount === 0 });
  } catch (err) {
    console.error("Handle check failed:", err);
    res.status(500).json({ error: "Handle check failed" });
  }
});

// Register route — called from frontend
router.post("/register", async (req, res) => {
  const { uid, name, email } = req.body;

  try {
    
    const result = await pool.query(
      `INSERT INTO mm.users (user_id, handle, email)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [uid, name, email]
    );

    res.status(201).json(result.rows[0]);
   } catch (err) {
    console.error("Database insert failed:", err);
    if (err.code === "23505" && err.detail?.includes("handle")) {
      return res.status(400).json({ error: "Handle already exists" });
    }
    res.status(500).json({ error: "Database insert failed" });
  }
});

export default router;
