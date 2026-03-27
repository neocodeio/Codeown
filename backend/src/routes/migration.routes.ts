import { Router } from "express";
import { migrateBase64Images } from "../controllers/migration.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// POST /migration/migrate-base64 - Migrate all base64 images to Supabase Storage - PRIVATE ADMIN ONLY IN PREP
router.post("/migrate-base64", requireAuth, migrateBase64Images);

export default router;
