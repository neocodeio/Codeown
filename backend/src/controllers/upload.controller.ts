import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

// Extend Request type to include file property
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Simple image upload handler - converts image to base64
// In production, you should use Supabase Storage or similar service
export async function uploadImage(req: MulterRequest, res: Response) {
  try {
    const user = req.user;
    const userId = user?.sub || user?.id || user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    // Handle multipart/form-data upload
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Validate file type
    if (!file.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "Invalid file type. Only images are allowed" });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "File size should be less than 5MB" });
    }

    // Convert buffer to base64
    const base64Image = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

    // For now, return the base64 string
    // In production, upload to Supabase Storage and return the public URL
    return res.json({ 
      success: true, 
      url: base64Image // Match what frontend expects
    });
  } catch (error: any) {
    console.error("Unexpected error in uploadImage:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      details: error?.message 
    });
  }
}



