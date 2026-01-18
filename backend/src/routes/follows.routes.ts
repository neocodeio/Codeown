import { Router } from "express";
import { followUser, getFollowStatus, getFollowers, getFollowing } from "../controllers/follows.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/:userId", requireAuth, followUser);
router.get("/:userId/status", getFollowStatus);
router.get("/:userId/followers", getFollowers);
router.get("/:userId/following", getFollowing);

export default router;
