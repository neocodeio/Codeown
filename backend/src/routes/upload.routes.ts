import { Router } from "express";
import { uploadImage } from "../controllers/upload.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/image", requireAuth, uploadImage);

export default router;



