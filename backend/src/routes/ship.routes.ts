import { Router } from "express";
import { getShipWeekStatus, submitShip, voteShip, setFounderScore, getHallOfFame, createShipWeek } from "../controllers/ship.controller.js";

const router = Router();

// Public routes (anyone can see status/hall of fame)
router.get("/status", getShipWeekStatus);
router.get("/hall-of-fame", getHallOfFame);

// Protected routes (require Clerk authentication)
// The middleware will be added at index.ts or in a parent route file
router.post("/submit", submitShip);
router.post("/vote/:submissionId", voteShip);

// Admin-only route
router.post("/admin/founder-score/:submissionId", setFounderScore);
router.post("/admin/create-week", createShipWeek);

export default router;
