import { Router } from "express";
import Order from "../models/Order.model.js";
import { crudController } from "../controllers/crud.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/rbac.middleware.js";

const router = Router();
const orders = crudController(Order, "Order", { beforeCreate: (body, req) => ({ ...body, createdBy: req.user._id }) });

router.use(protect);
router.get("/", orders.list);
router.post("/", allowRoles("admin", "warehouse_manager"), orders.create);
router.post("/import", allowRoles("admin"), (_req, res) => res.status(501).json({ success: false, message: "CSV import placeholder" }));
router.get("/:id", orders.get);
router.put("/:id", allowRoles("admin", "warehouse_manager"), orders.update);
router.patch("/:id/status", allowRoles("admin", "warehouse_manager"), orders.update);

export default router;

