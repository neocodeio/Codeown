import { Router } from "express";
import { getUserProfile, updateUserProfile, pinPost, getUserTotalLikes, completeOnboarding } from "../controllers/users.controller.js";
import { getUserProjects } from "../controllers/projects.controller.js";
import { getUserSavedProjects } from "../controllers/userSavedProjects.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/:userId", getUserProfile);
router.put("/:userId", requireAuth, updateUserProfile);
router.post("/pin/:postId", requireAuth, pinPost);
router.post("/onboarding/complete", requireAuth, completeOnboarding);
router.get("/:userId/likes", getUserTotalLikes);
router.get("/:userId/projects", getUserProjects);
router.get("/:userId/saved-projects", getUserSavedProjects);

export default router;

