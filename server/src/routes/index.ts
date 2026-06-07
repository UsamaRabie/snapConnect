import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import postRoutes from "./post.routes";
import notificationRoutes from "./notification.routes";
import conversationRoutes from "./conversation.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/notifications", notificationRoutes);
router.use("/conversations", conversationRoutes);

export default router;
