import { Router } from "express";
import * as organizationsController from "../controllers/organizations.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, organizationsController.registerOrganization);
router.get("/me", organizationsController.getMyOrganization);
router.get("/:id", organizationsController.getOrganization);
router.put("/:id/status", organizationsController.updateOrganizationStatus);

export default router;
