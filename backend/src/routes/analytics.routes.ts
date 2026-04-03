import { Router } from "express";
import { trackEvent, getAnalytics, getWeeklyRecap, getUserActivityHeatmap } from "../controllers/analytics.controller.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/track", optionalAuth, trackEvent);
router.get("/summary", requireAuth, getAnalytics);
router.get("/recap", requireAuth, getWeeklyRecap);
router.get("/heatmap/:userId", optionalAuth, getUserActivityHeatmap);

export default router;
