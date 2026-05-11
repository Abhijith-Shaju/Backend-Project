import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";
import User from "../models/User.model.js";

export async function protect(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new AppError("Authentication required", 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password -refreshToken");
    if (!req.user || !req.user.isActive) return next(new AppError("User is not active", 401));
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401));
  }
}

