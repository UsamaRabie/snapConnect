import { Router } from "express";
import { protect, optionalAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";
import * as userCtrl from "../controllers/user.controller";
import * as profileCtrl from "../controllers/profile.controller";

const router = Router();

router.get("/search", protect, userCtrl.search);
router.get("/search/suggestions", protect, userCtrl.getSuggestions);
router.get("/check-username", protect, profileCtrl.checkUsername);
router.get("/username/:username", optionalAuth, profileCtrl.getProfileByUsername);

router.put("/profile", protect, profileCtrl.updateProfile);
router.post(
  "/profile/avatar",
  protect,
  upload.single("avatar"),
  profileCtrl.uploadAvatar
);
router.post(
  "/profile/cover",
  protect,
  upload.single("coverImage"),
  profileCtrl.uploadCoverImage
);

router.get("/suggested", protect, userCtrl.getSuggested);
router.get("/:id/posts", optionalAuth, profileCtrl.getUserPosts);
router.get("/:id", optionalAuth, userCtrl.getProfile);
router.post("/:id/follow", protect, userCtrl.follow);
router.delete("/:id/follow", protect, userCtrl.unfollow);
router.get("/:id/followers", optionalAuth, userCtrl.getFollowers);
router.get("/:id/following", optionalAuth, userCtrl.getFollowing);

export default router;
