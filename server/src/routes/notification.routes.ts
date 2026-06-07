import { Router } from "express";
import { protect } from "../middleware/auth";
import * as notificationCtrl from "../controllers/notification.controller";

const router = Router();

router.use(protect);

router.get("/", notificationCtrl.getNotifications);
router.get("/unread-count", notificationCtrl.getUnreadCount);
router.put("/:id/read", notificationCtrl.markAsRead);
router.put("/read-all", notificationCtrl.markAllAsRead);

export default router;
