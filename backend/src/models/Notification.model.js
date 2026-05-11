import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  message: String,
  type: { type: String, enum: ["info", "warning", "success", "error"], default: "info" },
  isRead: { type: Boolean, default: false },
  link: String
}, { timestamps: true });

export default mongoose.model("Notification", NotificationSchema);

