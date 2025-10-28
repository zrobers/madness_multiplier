import { Router } from "express";
import * as poolsController from "../controllers/poolsController.js";

const r = Router();

/**
 * GET /api/pools
 * Returns an array of pools (no authentication in this example).
 */
r.get("/", async (req, res, next) => {
  try {
    const rows = await poolsController.getAllPools();
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/pools/:id
 * Returns a single pool with members.
 */
r.get("/:id", async (req, res, next) => {
  try {
    const poolId = req.params.id;
    const pool = await poolsController.getPoolById(poolId);
    res.json(pool);
  } catch (err) {
    // Map controller error codes to HTTP status codes
    if (err.code === "invalid-id") return res.status(400).json({ error: err.message });
    if (err.code === "not-found") return res.status(404).json({ error: err.message });
    next(err);
  }
});

export default r;
