import { Router } from "express";
import { generateSitemap, serveDynamicSEO } from "../controllers/seo.controller.js";

const router = Router();

// GET /sitemap.xml 
router.get("/sitemap.xml", generateSitemap);

// Fallback for all other routes to serve dynamic HTML with SEO tags
router.get(/.*/, serveDynamicSEO);

export default router;
