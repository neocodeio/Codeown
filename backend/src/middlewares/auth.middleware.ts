import type { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/clerk-sdk-node";

// Verify Clerk is configured
if (!process.env.CLERK_SECRET_KEY) {
  console.warn("WARNING: CLERK_SECRET_KEY is not set in environment variables. Authentication will fail.");
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log("No authorization header");
    return res.status(401).json({ error: "No authorization header" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log("No token in authorization header");
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const user = await clerkClient.verifyToken(token);
    console.log("Token verified successfully. User object:", JSON.stringify(user, null, 2));
    (req as any).user = user;
    next();
  } catch (error: any) {
    console.error("Token verification error:", error?.message || error);
    console.error("Full error:", error);
    return res.status(401).json({ error: "Invalid or expired token", details: error?.message });
  }
}
