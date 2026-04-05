import { Router } from "express";
import { 
  createCompetition, 
  getActiveCompetition, 
  joinCompetition, 
  submitProject, 
  voteProject, 
  checkEligibility, 
  setFounderScore, 
  getHallOfFame 
} from "../controllers/ship.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.get("/active", getActiveCompetition);
router.get("/hall-of-fame", getHallOfFame);

// Protected routes (User)
router.post("/join/:weekId", requireAuth, joinCompetition);
router.post("/submit/:weekId", requireAuth, submitProject);
router.post("/vote/:submissionId", requireAuth, voteProject);
router.get("/eligibility/:weekId", requireAuth, checkEligibility);

// Protected routes (Admin: amin.ceo)
router.post("/launch", requireAuth, createCompetition);
router.post("/score/:submissionId", requireAuth, setFounderScore);

export default router;
