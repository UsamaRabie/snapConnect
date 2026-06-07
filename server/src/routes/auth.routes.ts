import { Router } from "express";
import { register, login, refresh, logout, getMe } from "../controllers/auth.controller";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema, refreshTokenSchema } from "../validators/auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshTokenSchema), refresh);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

export default router;
