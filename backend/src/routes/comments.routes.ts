import { Router } from "express";
import { getComments, createComment, deleteComment } from "../controllers/comments.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/:postId", getComments);
router.post("/", requireAuth, createComment);
router.delete("/:commentId", requireAuth, deleteComment);

export default router;

