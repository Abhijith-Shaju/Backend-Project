import { Router } from "express";
import { dashboard } from "../controllers/analytics.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/rbac.middleware.js";

const router = Router();

router.use(protect);
router.get("/dashboard", allowRoles("admin", "warehouse_manager"), dashboard);
router.get("/shipments", allowRoles("admin", "warehouse_manager"), (_req, res) => res.json({ success: true, data: [] }));
router.get("/inventory", allowRoles("admin", "warehouse_manager"), (_req, res) => res.json({ success: true, data: [] }));
router.get("/agents", allowRoles("admin"), (_req, res) => res.json({ success: true, data: [] }));
router.get("/export", allowRoles("admin"), (_req, res) => res.status(501).json({ success: false, message: "Export placeholder" }));

export default router;

