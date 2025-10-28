import { Router } from "express";
import pool from "./index.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { auth0_sub, handle, email } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO mm.users (auth0_sub, handle, email)
       VALUES ($1, $2, $3) RETURNING *`,
      [auth0_sub, handle, email]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to register user" });
  }
});

export default router;

