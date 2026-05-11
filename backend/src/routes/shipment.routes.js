import { Router } from "express";
import { shipmentCrud, trackShipment, updateShipmentStatus } from "../controllers/shipment.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/rbac.middleware.js";
import AppError from "../utils/AppError.js";

const router = Router();

router.get("/track/:trackingNo", trackShipment);
router.use(protect);
router.get("/", shipmentCrud.list);
router.post("/", allowRoles("admin", "warehouse_manager"), shipmentCrud.create);
router.get("/:id", shipmentCrud.get);
router.put("/:id", allowRoles("admin", "warehouse_manager"), shipmentCrud.update);
router.patch("/:id/status", allowRoles("admin", "warehouse_manager", "delivery_agent"), updateShipmentStatus);
router.post("/:id/pod", allowRoles("delivery_agent"), (_req, _res, next) => next(new AppError("POD upload not implemented", 501)));

export default router;

