import { Router } from "express";
import { 
    getStartups, 
    getStartup, 
    createStartup, 
    updateStartup, 
    deleteStartup, 
    getStartupMembers, 
    getStartupJobs, 
    getStartupFeed, 
    postStartupUpdate,
    addStartupMember,
    removeStartupMember,
    createStartupJob,
    deleteStartupJob,
    getCooldownStatus,
    upvoteStartup
} from "../controllers/startups.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.get("/", getStartups);
router.get("/cooldown/status", requireAuth, getCooldownStatus);
router.get("/:id", getStartup);
router.get("/:id/members", getStartupMembers);
router.get("/:id/jobs", getStartupJobs);
router.get("/:id/updates", getStartupFeed);

// Protected routes
router.post("/", requireAuth, createStartup);
router.put("/:id", requireAuth, updateStartup);
router.delete("/:id", requireAuth, deleteStartup);
router.post("/:id/members", requireAuth, addStartupMember);
router.delete("/:id/members/:userId", requireAuth, removeStartupMember);
router.post("/:id/jobs", requireAuth, createStartupJob);
router.delete("/:id/jobs/:jobId", requireAuth, deleteStartupJob);
router.post("/:id/updates", requireAuth, postStartupUpdate);
router.post("/:id/upvote", requireAuth, upvoteStartup);

export default router;

