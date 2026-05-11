import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/apiResponse.js";

function signToken(user, secret, expiresIn) {
  return jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn });
}

export async function register(req, res, next) {
  try {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) throw new AppError("Email is already registered", 409);

    const password = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({ ...req.body, password });
    sendSuccess(res, { id: user._id, name: user.name, email: user.email, role: user.role }, "Registered", 201);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const user = await User.findOne({ email: req.body.email }).select("+password +refreshToken");
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      throw new AppError("Invalid email or password", 401);
    }

    const accessToken = signToken(user, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || "15m");
    const refreshToken = signToken(user, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES_IN || "7d");
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" });
    sendSuccess(res, { accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } }, "Logged in");
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res) {
  res.clearCookie("refreshToken");
  sendSuccess(res, null, "Logged out");
}

