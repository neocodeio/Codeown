import { Router } from "express";
import {
  getProjectComments,
  createProjectComment,
  updateProjectComment,
  deleteProjectComment
} from "../controllers/projectComments.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.get("/projects/:id/comments", getProjectComments);

// Protected routes
router.post("/projects/:id/comments", requireAuth, createProjectComment);
router.put("/project-comments/:commentId", requireAuth, updateProjectComment);
router.delete("/project-comments/:commentId", requireAuth, deleteProjectComment);

export default router;
