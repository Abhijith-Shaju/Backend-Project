import { Router } from "express";
import Vendor from "../models/Vendor.model.js";
import { crudController } from "../controllers/crud.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/rbac.middleware.js";

const router = Router();
const vendors = crudController(Vendor, "Vendor");

router.use(protect);
router.get("/", vendors.list);
router.post("/", allowRoles("admin", "warehouse_manager"), vendors.create);
router.get("/:id", vendors.get);
router.put("/:id", allowRoles("admin"), vendors.update);
router.get("/:id/scorecard", allowRoles("admin", "warehouse_manager"), (_req, res) => res.json({ success: true, data: { onTimeRate: 92, defectRate: 2.1, leadTimeDays: 5 } }));

export default router;

