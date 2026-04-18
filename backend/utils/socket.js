const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const Post = require("../models/Post");

// Shared map: userId (string) -> socketId
// Controllers import emitToUser to push targeted events without importing io
const onlineUsersMap = new Map();
let _io = null;

/**
 * Push a socket event to a specific user if they are online.
 * @param {string} userId
 * @param {string} event
 * @param {object} data
 */
const emitToUser = (userId, event, data) => {
  if (!_io || !userId) return;
  const socketId = onlineUsersMap.get(String(userId));
  if (socketId) {
    _io.to(socketId).emit(event, data);
  }
};

/**
 * Broadcast a socket event to ALL connected clients (global announcement).
 * @param {string} event
 * @param {object} data
 */
const broadcastAll = (event, data) => {
  if (!_io) return;
  _io.emit(event, data);
};

/**
 * Broadcast an event to a specific room.
 * @param {string} roomId 
 * @param {string} event 
 * @param {object} data 
 */
const broadcastToRoom = (roomId, event, data) => {
    if (!_io || !roomId) return;
    _io.to(roomId).emit(event, data);
};

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ["websocket"]
  });

  _io = io; // expose for emitToUser
  const onlineUsers = onlineUsersMap; // alias to shared map

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

      if (sender.toString() === receiver.toString()) {
          console.warn("[Socket] User tried to message themselves:", sender);
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
        
        // Notify the receiver privately if they are online but NOT necessarily in the room
        const receiverSocketId = onlineUsers.get(receiver.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("new_message_alert", {
                roomId,
                message: formattedMsg,
                chat: {
                   id: sender.toString(),
                   username: "Other" // Placeholder, client usually knows who sent it or fetches updated list
                }
            });
        }
        
        // Notify sender to update their own ConversationList
        socket.emit("own_message_sent", { ...formattedMsg, senderId: receiver.toString(), receiverId: sender.toString() });

        // Notify sender about delivery (status update)
        socket.emit("message_status_sent", { id: formattedMsg.id, status: newMessage.status });

        // Increment share count if sharing a post/reel
        if ((type === 'post' || type === 'reel') && payload?.id) {
            try {
                await Post.findByIdAndUpdate(payload.id, { 
                    $inc: { shares: 1 },
                    $push: { sharedBy: senderObj } 
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

module.exports = { initSocket, emitToUser, broadcastAll, broadcastToRoom };

