import type { Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase.js";

/**
 * Proxy endpoint to serve Supabase images with proper CORS headers
 * This bypasses ORB blocking issues by serving images through our backend
 */
export async function proxyImage(req: Request, res: Response) {
  try {
    const { imageUrl } = req.query;
    
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Only allow Supabase storage URLs (strictly validated)
    if (!imageUrl.startsWith('https://') || !imageUrl.includes('.supabase.co/storage/v1/object/public/')) {
      return res.status(400).json({ error: 'Invalid image URL' });
    }

    // Extract bucket and path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf('public');
    if (bucketIndex === -1) {
      return res.status(400).json({ error: 'Invalid Supabase URL format' });
    }

    const bucket = pathParts[bucketIndex - 1]; // 'images'
    const path = pathParts.slice(bucketIndex + 1).join('/'); // path after 'public'

    // Download the file from Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket as string)
      .download(path);

    if (error) {
      console.error('Error downloading image:', error);
      return res.status(404).json({ error: 'Image not found' });
    }

    // Set proper CORS headers
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'image/png', // Default to PNG, could be detected from file extension
      'Cache-Control': 'public, max-age=31536000', // 1 year cache
    });

    res.send(data);
  } catch (error: any) {
    console.error('Error proxying image:', error.message);
    return res.status(500).json({ error: 'Failed to fetch image' });
  }
}
