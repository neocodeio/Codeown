import { Router } from "express";
import { migrateBase64Images } from "../controllers/migration.controller.js";

const router = Router();

// POST /migration/migrate-base64 - Migrate all base64 images to Supabase Storage
router.post("/migrate-base64", migrateBase64Images);

export default router;
