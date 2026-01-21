import { Router } from "express";
import { likePost, getPostLikes, getUserLikes, likeComment, getCommentLikes } from "../controllers/likes.controller.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/post/:postId", requireAuth, likePost);
router.get("/post/:postId", getPostLikes);
router.post("/comment/:commentId", requireAuth, likeComment);
router.get("/comment/:commentId", optionalAuth, getCommentLikes);
router.get("/user/:userId", getUserLikes);

export default router;
