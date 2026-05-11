import { Router } from "express";
import { login, logout, register } from "../controllers/auth.controller.js";

import AppError from "../utils/AppError.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", (_req, _res, next) => next(new AppError("Refresh flow not implemented", 501)));
router.post("/forgot-password", (_req, _res, next) => next(new AppError("Password reset not implemented", 501)));
router.post("/reset-password", (_req, _res, next) => next(new AppError("Password reset not implemented", 501)));

export default router;

