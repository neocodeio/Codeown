import { Router } from "express";
import {
  handleClerkWebhook,
  handleDodoWebhook,
} from "../controllers/webhooks.controller.js";

const router = Router();

// Clerk webhook endpoint
router.post("/clerk", handleClerkWebhook);

// Dodo Payments webhook endpoint
router.post("/dodo", handleDodoWebhook);

export default router;

