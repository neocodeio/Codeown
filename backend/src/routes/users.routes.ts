import { Router } from "express";
import {
    getUserProfile,
    updateUserProfile,
    pinPost,
    getUserTotalLikes,
    completeOnboarding,
    updateStreak,
    getRecommendedUsers,
    trackActiveSession,
    getActiveCount
} from "../controllers/users.controller.js";
import { recordProfileView } from "../controllers/profileViews.controller.js";
import { getUserProjects } from "../controllers/projects.controller.js";
import { getUserSavedProjects } from "../controllers/userSavedProjects.controller.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Static/specific routes MUST come before /:userId to avoid being swallowed by the wildcard
router.get("/recommended", optionalAuth, getRecommendedUsers);
router.get("/active/count", getActiveCount);
router.post("/active/ping", optionalAuth, trackActiveSession);
router.post("/pin/:postId", requireAuth, pinPost);
router.post("/onboarding/complete", requireAuth, completeOnboarding);
router.post("/streak/update", requireAuth, updateStreak);

// Wildcard routes last
router.get("/:userId", getUserProfile);
router.put("/:userId", requireAuth, updateUserProfile);
router.get("/:userId/likes", getUserTotalLikes);
router.get("/:userId/projects", getUserProjects);
router.get("/:userId/saved-projects", getUserSavedProjects);
router.post("/:userId/view", requireAuth, recordProfileView);

export default router;

