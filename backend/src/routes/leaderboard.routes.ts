import { Router } from "express";
import { getLeaderboard, getXPLeaderboard } from "../controllers/leaderboard.controller.js";

const router = Router();

router.get("/pulse", getLeaderboard);
router.get("/xp", getXPLeaderboard);

export default router;
