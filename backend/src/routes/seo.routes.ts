import { Router } from "express";
import { generateSitemap } from "../controllers/seo.controller.js";

const router = Router();

// GET /sitemap.xml 
router.get("/sitemap.xml", generateSitemap);

export default router;
