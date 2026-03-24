const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const Post = require("../models/Post");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Adjust for production
      methods: ["GET", "POST"]
    }
  });

  const onlineUsers = new Map(); // userId -> socketId

  io.on("connection", (socket) => {
    // We expect the user to emit their userId upon connection (or derive from auth if using middleware)
    socket.on("register_user", (userId) => {
      if (!userId) return;
      socket.userId = userId;
      onlineUsers.set(userId.toString(), socket.id);
      io.emit("user_status_changed", { userId, status: "online" });
      // console.log(`User ${userId} registered at socket ${socket.id}`);
    });

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      // console.log(`User joined room: ${roomId}`);
    });

    socket.on("typing", ({ roomId, userId }) => {
        socket.to(roomId).emit("user_typing", { roomId, userId });
    });

    socket.on("stop_typing", ({ roomId, userId }) => {
        socket.to(roomId).emit("user_stop_typing", { roomId, userId });
    });

    socket.on("mark_seen", async ({ roomId, userId, currentUserId }) => {
        try {
            // Update all messages in this room received by currentUserId to 'seen'
            await Message.updateMany(
                { roomId, receiver: currentUserId, status: { $ne: "seen" } },
                { $set: { status: "seen" } }
            );
            // Notify the other user (if online)
            socket.to(roomId).emit("messages_seen_update", { roomId, userId: currentUserId });
        } catch (error) {
            console.error("[Socket] mark_seen error:", error);
        }
    });

    socket.on("send_message", async (data) => {
      const { roomId, sender, receiver, text, type, payload } = data;
      // console.log("[Socket] Received send_message:", { roomId, sender, receiver, type });

      if (!sender || !receiver || !roomId) {
          console.error("[Socket] Missing required fields for message:", { sender, receiver, roomId });
          return;
      }
      
      try {
        // Validate IDs before casting
        if (!mongoose.Types.ObjectId.isValid(sender) || !mongoose.Types.ObjectId.isValid(receiver)) {
            console.error("[Socket] Invalid sender or receiver ID:", { sender, receiver });
            return;
        }

        const senderObj = new mongoose.Types.ObjectId(sender);
        const receiverObj = new mongoose.Types.ObjectId(receiver);

        const newMessage = await Message.create({
          sender: senderObj,
          receiver: receiverObj,
          roomId,
          text: text || "",
          type: type || "text",
          payload: payload || null,
          status: onlineUsers.has(receiver.toString()) ? "delivered" : "sent"
        });

        const formattedMsg = {
            id: newMessage._id.toString(),
            sender: "other", // for the receiver
            senderId: sender.toString(),
            text: text || "",
            type: type || "text",
            payload: payload || null,
            status: newMessage.status,
            timestamp: new Date(newMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        };

        // Broadcast to others in the room
        socket.to(roomId).emit("receive_message", formattedMsg);
        
        // Notify sender about delivery (status update)
        socket.emit("message_status_sent", { id: formattedMsg.id, status: newMessage.status });

        // Increment share count if sharing a post/reel
        if ((type === 'post' || type === 'reel') && payload?.id) {
            try {
                await Post.findByIdAndUpdate(payload.id, { 
                    $inc: { shares: 1 },
                    $addToSet: { sharedBy: senderObj } 
                });
            } catch (err) {
                console.error("[Socket] Failed to increment share count:", err);
            }
        }

      } catch (error) {
        console.error("[Socket] Message creation failed:", error);
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
          onlineUsers.delete(socket.userId.toString());
          io.emit("user_status_changed", { userId: socket.userId, status: "offline" });
          // console.log(`User ${socket.userId} disconnected`);
      }
    });
  });

  return io;
};

module.exports = initSocket;
