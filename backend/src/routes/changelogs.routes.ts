import { Router } from "express";
import { getChangelogs, createChangelog } from "../controllers/changelogs.controller.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", optionalAuth, getChangelogs);
router.post("/", requireAuth, createChangelog);

export default router;
