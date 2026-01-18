import { Router } from "express";
import { likePost, getPostLikes, getUserLikes } from "../controllers/likes.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/post/:postId", requireAuth, likePost);
router.get("/post/:postId", getPostLikes);
router.get("/user/:userId", getUserLikes);

export default router;
