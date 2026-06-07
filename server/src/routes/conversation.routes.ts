import { Router } from "express";
import {
  getConversations,
  getOrCreate,
  getMessages,
  sendMessage,
} from "../controllers/conversation.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.get("/", protect, getConversations);
router.post("/:userId", protect, getOrCreate);
router.get("/:id/messages", protect, getMessages);
router.post("/:id/messages", protect, sendMessage);

export default router;
