import { Router } from "express";
import { getPosts, getPostById, getPostsByUser, createPost, updatePost, deletePost, votePost, getTrendingTags } from "../controllers/posts.controller.js";
import { toggleRepost } from "../controllers/reposts.controller.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", optionalAuth, getPosts);
router.get("/trending/tags", getTrendingTags);
router.post("/repost", requireAuth, toggleRepost);
router.get("/:id", optionalAuth, getPostById); // Get single post by ID - must be before /user/:userId
router.get("/user/:userId", optionalAuth, getPostsByUser); // Get posts by user ID
router.post("/", requireAuth, createPost);
router.post("/:id/vote", requireAuth, votePost);
router.put("/:id", requireAuth, updatePost);
router.delete("/:id", requireAuth, deletePost);

export default router;
