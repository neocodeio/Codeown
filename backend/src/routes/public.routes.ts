import { Router } from "express";
import { getPublicBuilderProfile, getStreakBadge, getHeatmapBadge } from "../controllers/public.controller.js";

const router = Router();

// Builder Endpoints
router.get("/builders/:username", getPublicBuilderProfile);
router.get("/builders/:username/streak-badge", getStreakBadge);
router.get("/builders/:username/heatmap", getHeatmapBadge);

export default router;
