import { Router } from "express";
import { getComments, createComment, deleteComment, getCommentDetail } from "../controllers/comments.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/detail/:commentId", getCommentDetail);
router.get("/:postId", getComments);
router.post("/", requireAuth, createComment);
router.delete("/:commentId", requireAuth, deleteComment);

export default router;

