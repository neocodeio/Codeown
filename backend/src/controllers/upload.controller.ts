import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

// Simple image upload handler - converts image to base64
// In production, you should use Supabase Storage or similar service
export async function uploadImage(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const userId = user?.sub || user?.id || user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    // For now, we'll accept base64 encoded images
    // In production, use multipart/form-data and upload to Supabase Storage
    const { image } = req.body; // Expecting base64 string

    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Image data is required" });
    }

    // Validate base64 image
    if (!image.startsWith("data:image/")) {
      return res.status(400).json({ error: "Invalid image format" });
    }

    // For now, return the base64 string
    // In production, upload to Supabase Storage and return the public URL
    return res.json({ 
      success: true, 
      imageUrl: image // In production, this would be the Supabase Storage URL
    });
  } catch (error: any) {
    console.error("Unexpected error in uploadImage:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      details: error?.message 
    });
  }
}



