import { Router } from "express";
import { getUserProfile, updateUserProfile } from "../controllers/users.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/:userId", getUserProfile);
router.put("/:userId", requireAuth, updateUserProfile);

export default router;

