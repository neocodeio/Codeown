import { Router } from "express";
import { handleClerkWebhook } from "../controllers/webhooks.controller.js";

const router = Router();

// Clerk webhook endpoint
router.post("/clerk", handleClerkWebhook);

export default router;

