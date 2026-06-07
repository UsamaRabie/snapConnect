import { Router } from "express";
import {
  create,
  getFeed,
  getUserPosts,
  getById,
  like,
  unlike,
  remove,
  explore,
  update,
  getLikes,
  getTagged,
} from "../controllers/post.controller";
import * as commentCtrl from "../controllers/comment.controller";
import * as saveCtrl from "../controllers/save.controller";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createPostSchema, updatePostSchema } from "../validators/post.validator";
import { createCommentSchema, updateCommentSchema } from "../validators/comment.validator";
import { upload } from "../middleware/upload";

const router = Router();

router.get("/feed", protect, getFeed);
router.get("/explore", protect, explore);
router.get("/user/:userId", protect, getUserPosts);
router.get("/saved", protect, saveCtrl.getSaved);
router.get("/tagged/:userId", protect, getTagged);
router.get("/:id", protect, getById);
router.post("/", protect, upload.single("image"), validate(createPostSchema), create);
router.put("/:id", protect, upload.single("image"), validate(updatePostSchema), update);
router.post("/:id/like", protect, like);
router.delete("/:id/like", protect, unlike);
router.get("/:id/likes", protect, getLikes);
router.post("/:id/save", protect, saveCtrl.save);
router.delete("/:id/save", protect, saveCtrl.unsave);
router.delete("/:id", protect, remove);

router.get("/:id/comments", protect, commentCtrl.getComments);
router.post("/:id/comments", protect, validate(createCommentSchema), commentCtrl.create);
router.get("/:id/comments/:commentId", protect, commentCtrl.getReplies);
router.get("/:id/comments/:commentId/thread", protect, commentCtrl.getThread);
router.put("/:id/comments/:commentId", protect, validate(updateCommentSchema), commentCtrl.update);
router.delete("/:id/comments/:commentId", protect, commentCtrl.remove);

export default router;
