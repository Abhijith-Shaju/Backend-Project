import { Router } from "express";
import Vehicle from "../models/Vehicle.model.js";
import { crudController } from "../controllers/crud.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/rbac.middleware.js";
import AppError from "../utils/AppError.js";

const router = Router();
const vehicles = crudController(Vehicle, "Vehicle");

router.use(protect);
router.get("/", allowRoles("admin", "warehouse_manager"), vehicles.list);
router.post("/", allowRoles("admin"), vehicles.create);
router.get("/:id", vehicles.get);
router.put("/:id", allowRoles("admin"), vehicles.update);
router.post("/:id/fuel", allowRoles("delivery_agent", "warehouse_manager"), (_req, _res, next) => next(new AppError("Fuel log not implemented", 501)));

export default router;

