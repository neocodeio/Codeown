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

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
  console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
  console.log("SUPABASE_URL", process.env.SUPABASE_URL);
  console.log("SERVICE_ROLE", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Start scheduled jobs
  initializeCronJobs();
});
