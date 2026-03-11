import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let io: Server | null = null;

export function initializeSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://codeown.space",
      ],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  console.log("[Socket] Socket.io initialized.");
  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

export function emitUpdate(event: string, data: any) {
  if (io) {
    io.emit(event, data);
    console.log(`[Socket] Emitted ${event}:`, data);
  }
}
