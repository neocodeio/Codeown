import { Router } from "express";
import { proxyImage } from "../controllers/image-proxy.controller.js";

const router = Router();

// GET /image-proxy?imageUrl=[supabase-url] - Proxy Supabase images with CORS headers
router.get("/image-proxy", proxyImage);

export default router;
