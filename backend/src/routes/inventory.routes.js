import { Router } from "express";
import { adjustStock, lowStock, productCrud } from "../controllers/inventory.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/rbac.middleware.js";

const router = Router();

router.use(protect);
router.get("/low-stock", lowStock);
router.get("/", productCrud.list);
router.post("/", allowRoles("admin", "warehouse_manager"), productCrud.create);
router.get("/:id", productCrud.get);
router.put("/:id", allowRoles("admin", "warehouse_manager"), productCrud.update);
router.post("/:id/stock", allowRoles("admin", "warehouse_manager"), adjustStock);

export default router;

