import "dotenv/config";
import app from "./app.js";
import type { Request, Response } from "express";

const PORT = process.env.PORT || 5000;

app.get("/", (req: Request, res: Response) => {
  res.send("Backend is running");
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
  console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
  console.log("SUPABASE_URL", process.env.SUPABASE_URL);
  console.log("SERVICE_ROLE", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
});
