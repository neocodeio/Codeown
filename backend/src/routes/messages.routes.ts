import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getConversations, getMessages, sendMessage, toggleReaction } from "../controllers/messages.controller.js";

const router = Router();

router.get("/", requireAuth, getConversations);
router.get("/:id/messages", requireAuth, getMessages);
router.post("/", requireAuth, sendMessage);
router.patch("/message/:messageId/reaction", requireAuth, toggleReaction);

export default router;
