import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { 
    getConversations, 
    getMessages, 
    sendMessage, 
    toggleReaction, 
    deleteMessage, 
    deleteConversation,
    getUnreadMessagesCount,
    markAllMessagesAsRead 
} from "../controllers/messages.controller.js";

const router = Router();

router.get("/", requireAuth, getConversations);
router.get("/unread-count", requireAuth, getUnreadMessagesCount);
router.put("/mark-all-read", requireAuth, markAllMessagesAsRead);
router.get("/:id/messages", requireAuth, getMessages);
router.post("/", requireAuth, sendMessage);
router.patch("/message/:messageId/reaction", requireAuth, toggleReaction);
router.delete("/message/:messageId", requireAuth, deleteMessage);
router.delete("/conversation/:id", requireAuth, deleteConversation);

export default router;
