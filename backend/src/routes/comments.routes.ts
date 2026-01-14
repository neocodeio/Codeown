import { Router } from "express";
import { getComments, createComment } from "../controllers/comments.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/:postId", getComments);
router.post("/", requireAuth, createComment);

export default router;

