import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { initializeCronJobs } from "./src/services/cronJobs.js";

import { initSocket } from "./src/lib/socket.js";
const PORT = Number(process.env.PORT) || 5000;
const server = http.createServer(app);

// Initialize Socket.io through the centralized service
initSocket(server);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/health", async (req, res) => {
  try {
    const { data, error } = await (await import("./src/lib/supabase.js")).supabase.from("users").select("count").limit(1);
    if (error) throw error;
    res.json({ status: "healthy", database: "connected" });
  } catch (error: any) {
    res.status(500).json({ status: "error", database: "disconnected", error: error.message });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
  console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
  console.log("SUPABASE_URL", process.env.SUPABASE_URL);
  console.log("SERVICE_ROLE", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Start scheduled jobs
  initializeCronJobs();
});
