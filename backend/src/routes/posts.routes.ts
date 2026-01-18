import { Router } from "express";
import { getPosts, getPostById, getPostsByUser, createPost, updatePost, deletePost } from "../controllers/posts.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getPosts);
router.get("/:id", getPostById); // Get single post by ID - must be before /user/:userId
router.get("/user/:userId", getPostsByUser); // Get posts by user ID
router.post("/", requireAuth, createPost);
router.put("/:id", requireAuth, updatePost);
router.delete("/:id", requireAuth, deletePost);

export default router;
