import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { initializeCronJobs } from "./src/services/cronJobs.js";

const PORT = Number(process.env.PORT) || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://codeown.space", "https://www.codeown.space"],
    methods: ["GET", "POST"],
    credentials: true,
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", (userId: string) => {
    socket.join(userId);
  });

  socket.on("typing", ({ senderId, receiverId }: { senderId: string, receiverId: string }) => {
    socket.to(receiverId).emit("typing", { senderId });
  });

  socket.on("stop_typing", ({ senderId, receiverId }: { senderId: string, receiverId: string }) => {
    socket.to(receiverId).emit("stop_typing", { senderId });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

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
