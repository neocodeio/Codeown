import { Router } from "express";
import { trackEvent, getAnalytics } from "../controllers/analytics.controller.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/track", optionalAuth, trackEvent);
router.get("/summary", requireAuth, getAnalytics);

export default router;
