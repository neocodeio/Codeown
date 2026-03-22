import { Router } from "express";
import multer from "multer";
import { uploadImage, uploadAudio } from "../controllers/upload.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit max for handling small audio/images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("audio/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image, audio, or video formats are allowed"));
    }
  },
});

const router = Router();

router.post("/image", requireAuth, upload.single("image"), (req, res) => uploadImage(req as any, res));
router.post("/audio", requireAuth, upload.single("audio"), (req, res) => uploadAudio(req as any, res));

export default router;



