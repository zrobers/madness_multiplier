// routes/liveScoresRoutes.js
import { Router } from "express";
import { getLiveScores } from "../controllers/liveScoresController.js";

const router = Router();
router.get("/", getLiveScores);
export default router;

