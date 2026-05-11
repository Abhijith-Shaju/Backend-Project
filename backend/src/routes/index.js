import { Router } from "express";
import analyticsRoutes from "./analytics.routes.js";
import authRoutes from "./auth.routes.js";
import fleetRoutes from "./fleet.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import orderRoutes from "./order.routes.js";
import shipmentRoutes from "./shipment.routes.js";
import userRoutes from "./user.routes.js";
import vendorRoutes from "./vendor.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/shipments", shipmentRoutes);
router.use("/products", inventoryRoutes);
router.use("/orders", orderRoutes);
router.use("/vehicles", fleetRoutes);
router.use("/vendors", vendorRoutes);
router.use("/users", userRoutes);

export default router;

