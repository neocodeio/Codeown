import { Router } from "express";
import { unfurlUrl } from "../controllers/metadata.controller.js";

const router = Router();

// GET /metadata/unfurl?url=...
router.get("/unfurl", unfurlUrl);

export default router;
