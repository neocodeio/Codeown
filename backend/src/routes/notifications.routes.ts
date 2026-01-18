import { Router } from "express";
import { getNotifications, markNotificationRead, getUnreadCount } from "../controllers/notifications.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, getNotifications);
router.put("/:notificationId/read", requireAuth, markNotificationRead);
router.get("/unread/count", requireAuth, getUnreadCount);

export default router;
