import express from "express";
import pool from "../db.js";

const router = express.Router();

// Register route — called from frontend
router.post("/register", async (req, res) => {
  const { uid, name, email } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO mm.users (auth0_sub, handle, email)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [uid, name, email]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Database insert failed:", err);
    res.status(500).json({ error: "Database insert failed" });
  }
});

export default router;
