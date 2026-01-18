import { Router } from "express";
import { savePost, getSavedPosts, checkSaved } from "../controllers/saved.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/:postId", requireAuth, savePost);
router.get("/", requireAuth, getSavedPosts);
router.get("/:postId", requireAuth, checkSaved);

export default router;
