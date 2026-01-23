import { Router } from "express";
import { getUserProfile, updateUserProfile, pinPost, getUserTotalLikes } from "../controllers/users.controller.js";
import { getUserProjects } from "../controllers/projects.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/:userId", getUserProfile);
router.put("/:userId", requireAuth, updateUserProfile);
router.post("/pin/:postId", requireAuth, pinPost);
router.get("/:userId/likes", getUserTotalLikes);
router.get("/:userId/projects", getUserProjects);

export default router;

