import { Router } from "express";
import {
  getProjects,
  getProject,
  getUserProjects,
  createProject,
  updateProject,
  deleteProject,
  toggleProjectLike,
  getProjectLikeStatus,
  toggleProjectSave,
  getProjectSaveStatus,
  rateProject,
  getProjectChangelogs,
  addProjectChangelog,
  submitCofounderRequest,
  getProjectCofounderRequests,
  getMyCofounderApplications
} from "../controllers/projects.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.get("/", getProjects);
router.get("/:id", getProject);

// Protected routes
router.post("/", requireAuth, createProject);
router.put("/:id", requireAuth, updateProject);
router.delete("/:id", requireAuth, deleteProject);

// Like routes
router.post("/:id/like", requireAuth, toggleProjectLike);
router.get("/:id/like", requireAuth, getProjectLikeStatus);

// View routes
router.post("/:id/view", (req, res) => res.json({ success: true }));

// Save routes
router.post("/:id/save", requireAuth, toggleProjectSave);
router.get("/:id/save", requireAuth, getProjectSaveStatus);

// Rating routes
router.post("/:id/rate", requireAuth, rateProject);

// Changelog routes
router.get("/:id/changelogs", getProjectChangelogs);
router.post("/:id/changelogs", requireAuth, addProjectChangelog);

// Co-Founder Request routes
router.get("/my/cofounder-applications", requireAuth, getMyCofounderApplications);
router.post("/:id/cofounder-request", requireAuth, submitCofounderRequest);
router.get("/:id/cofounder-requests", requireAuth, getProjectCofounderRequests);

export default router;
