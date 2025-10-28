// routes/gamesRoutes.js
import { Router } from "express";
import { getGames } from "../controllers/gamesController.js";

const router = Router();
router.get("/", getGames);
export default router;

