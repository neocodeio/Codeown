import type { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

// Extend Request type to include file property
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Upload image to Supabase Storage and return public URL
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

    // Validate file size (1MB limit)
    if (file.size > 1024 * 1024) {
      return res.status(400).json({ error: "Image size must not exceed 1MB. Please choose a smaller image." });
    }

    // Generate unique filename
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return res.status(500).json({ error: "Failed to upload image" });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    return res.json({ 
      success: true, 
      url: publicUrl
    });
  } catch (error: any) {
    console.error("Unexpected error in uploadImage:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      details: error?.message 
    });
  }
}

export async function uploadAudio(req: MulterRequest, res: Response) {
  try {
    const user = req.user;
    const userId = user?.sub || user?.id || user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "User ID not found" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    if (!file.mimetype.startsWith("audio/") && !file.mimetype.startsWith("video/")) {
      return res.status(400).json({ error: "Invalid file type. Only audio is allowed" });
    }

    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "Audio size must not exceed 5MB." });
    }

    // Generate unique filename (.webm is what web MediaRecorder uses by default for audio)
    const fileExt = file.originalname.split('.').pop() || "webm";
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('chat-audio')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      console.error("Supabase audio upload error:", error);
      return res.status(500).json({ error: "Failed to upload audio", details: error.message });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-audio')
      .getPublicUrl(fileName);

    return res.json({ 
      success: true, 
      url: publicUrl
    });
  } catch (error: any) {
    console.error("Unexpected error in uploadAudio:", error);
    return res.status(500).json({ 
      error: "Internal server error", 
      details: error?.message 
    });
  }
}



