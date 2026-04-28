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

  const broadcastActiveCount = () => {
    if (!io) return;
    // Count unique user rooms (userId rooms)
    let count = 0;
    // io.sockets.adapter.rooms is a Map where key is room name
    // We want to count rooms that are actually user IDs, 
    // but just counting connected sockets is a good proxy for "active now".
    // Alternatively, we can count unique user IDs in our joined rooms.
    const socketCount = io.engine.clientsCount;
    io.emit("active_builders_count", { count: socketCount || 1 });
  };

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    broadcastActiveCount();

    socket.on("join", (userId: string) => {
      socket.join(userId);
      // Optional: more granular tracking if needed
    });

    socket.on("typing", ({ senderId, receiverId }: { senderId: string, receiverId: string }) => {
      if (io) io.to(receiverId).emit("typing", { senderId });
    });

    socket.on("stop_typing", ({ senderId, receiverId }: { senderId: string, receiverId: string }) => {
      if (io) io.to(receiverId).emit("stop_typing", { senderId });
    });

    socket.on("mark_read", async ({ senderId, receiverId, conversationId }: { senderId: string, receiverId: string, conversationId: number }) => {
      if (io) io.to(receiverId).emit("messages_read", { conversationId, readerId: senderId });
      
      try {
        const { supabase } = await import("./supabase.js");
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("conversation_id", conversationId)
          .neq("sender_id", senderId)
          .eq("is_read", false);
      } catch (dbErr) {
        console.error("Error updating read status in DB:", dbErr);
      }
    });
    
    socket.on("broadcast_activity", ({ userId, userName, type }: { userId: string, userName: string, type: "posting" | "launching" | "chatting" | "commenting" | null }) => {
      if (io) io.emit("global_activity", { userId, userName, type });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
      setTimeout(broadcastActiveCount, 1000); // Small delay to let adapter update
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

export const emitToUser = (userId: string, type: string, data: any) => {
  if (io) {
    io.to(userId).emit(type, data);
  }
};

export const isUserOnline = (userId: string) => {
  if (!io) return false;
  const room = io.sockets.adapter.rooms.get(userId);
  return !!room && room.size > 0;
};
