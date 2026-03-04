import { Router } from "express";
import {
  handleClerkWebhook,
  handleLemonWebhook,
} from "../controllers/webhooks.controller.js";

const router = Router();

// Clerk webhook endpoint
router.post("/clerk", handleClerkWebhook);

// Lemon Squeezy webhook endpoint
router.post("/lemon", handleLemonWebhook);

export default router;

