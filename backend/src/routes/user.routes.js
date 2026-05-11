import { Router } from "express";
import User from "../models/User.model.js";
import { crudController } from "../controllers/crud.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/rbac.middleware.js";

const router = Router();
const users = crudController(User, "User");

router.use(protect);
router.get("/", allowRoles("admin"), users.list);
router.get("/:id", users.get);
router.put("/:id", users.update);
router.patch("/:id/role", allowRoles("admin"), users.update);
router.delete("/:id", allowRoles("admin"), users.remove);

export default router;

