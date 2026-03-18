import { Server } from "socket.io";

let io: Server | null = null;

export const initSocket = (server: any) => {
  io = new Server(server, {
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
      if (io) io.to(receiverId).emit("typing", { senderId });
    });

    socket.on("stop_typing", ({ senderId, receiverId }: { senderId: string, receiverId: string }) => {
      if (io) io.to(receiverId).emit("stop_typing", { senderId });
    });

    socket.on("mark_read", ({ senderId, receiverId, conversationId }: { senderId: string, receiverId: string, conversationId: number }) => {
      if (io) io.to(receiverId).emit("messages_read", { conversationId, readerId: senderId });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

export const emitUpdate = (type: string, data: any) => {
  if (io) {
    io.emit("content_update", { type, data });
  }
};

export const isUserOnline = (userId: string) => {
  if (!io) return false;
  const room = io.sockets.adapter.rooms.get(userId);
  return !!room && room.size > 0;
};
