import { Router } from "express";
import { login, register, getMe, seedAdmin, logout } from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

// Public routes
router.post("/login", login);
router.post("/register", register);

// Seed admin — creates default admin credentials (call once)
router.post("/seed-admin", seedAdmin);

// Protected routes (require valid JWT)
router.get("/me", authMiddleware, getMe);
router.post("/logout", authMiddleware, logout);

export default router;
