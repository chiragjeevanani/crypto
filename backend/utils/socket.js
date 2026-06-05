const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const Post = require("../models/Post");
const GroupChat = require("../models/GroupChat");

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
    socket.on("register_user", async (userId) => {
      if (!userId) return;
      socket.userId = userId;
      onlineUsers.set(userId.toString(), socket.id);
      io.emit("user_status_changed", { userId, status: "online" });
      
      try {
        // Auto-join all group rooms for this user
        const userGroups = await GroupChat.find({ members: userId }).select('_id');
        userGroups.forEach(g => {
          socket.join(g._id.toString());
        });
      } catch (err) {
        console.error("[Socket] Failed to join group rooms:", err);
      }
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

    socket.on("mark_seen", async ({ roomId, userId, currentUserId, isGroup }) => {
        try {
            if (isGroup) {
                // Add currentUserId to seenBy array for all messages in this group not sent by them
                await Message.updateMany(
                    { groupId: roomId, sender: { $ne: currentUserId }, seenBy: { $ne: currentUserId } },
                    { $addToSet: { seenBy: currentUserId } }
                );
            } else {
                // Update all messages in this room received by currentUserId to 'seen'
                await Message.updateMany(
                    { roomId, receiver: currentUserId, status: { $ne: "seen" } },
                    { $set: { status: "seen", seenAt: new Date() } }
                );
            }
            // Notify the other user(s)
            socket.to(roomId).emit("messages_seen_update", { roomId, userId: currentUserId });
            
            // Notify the current user's other sessions/tabs to reset unread count for this room
            socket.emit("unread_count_reset", { roomId });
        } catch (error) {
            console.error("[Socket] mark_seen error:", error);
        }
    });

    socket.on("send_message", async (data) => {
      const { roomId, sender, receiver, groupId, text, type, payload } = data;
      // console.log("[Socket] Received send_message:", { roomId, sender, receiver, groupId, type });

      if (!sender || !roomId || (!receiver && !groupId)) {
          console.error("[Socket] Missing required fields for message:", { sender, receiver, groupId, roomId });
          return;
      }

      if (!groupId && sender.toString() === receiver.toString()) {
          console.warn("[Socket] User tried to message themselves:", sender);
          return;
      }
      
      try {
        const senderObj = new mongoose.Types.ObjectId(sender);
        
        let newMessage;
        if (groupId) {
            // Group Chat Message
            newMessage = await Message.create({
                sender: senderObj,
                groupId: new mongoose.Types.ObjectId(groupId),
                roomId, // usually same as groupId
                text: text || "",
                type: type || "text",
                payload: payload || null,
                seenBy: [senderObj]
            });
        } else {
            // 1v1 Message
            const receiverObj = new mongoose.Types.ObjectId(receiver);
            newMessage = await Message.create({
                sender: senderObj,
                receiver: receiverObj,
                roomId,
                text: text || "",
                type: type || "text",
                payload: payload || null,
                status: onlineUsers.has(receiver.toString()) ? "delivered" : "sent"
            });
        }

        const formattedMsg = {
            id: newMessage._id.toString(),
            sender: "other", // for the receiver
            senderId: sender.toString(),
            text: text || "",
            type: type || "text",
            payload: payload || null,
            status: newMessage.status,
            seenBy: newMessage.seenBy,
            timestamp: new Date(newMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        };

        // Broadcast to others in the room
        socket.to(roomId).emit("receive_message", formattedMsg);
        
        if (groupId) {
            // Fetch group members to notify them if they are online but not in the room window
            const group = await GroupChat.findById(groupId).select('members name');
            if (group) {
                group.members.forEach(memberId => {
                    if (memberId.toString() !== sender.toString()) {
                        const socketId = onlineUsers.get(memberId.toString());
                        if (socketId) {
                            io.to(socketId).emit("new_message_alert", {
                                roomId,
                                message: formattedMsg,
                                chat: {
                                   id: groupId,
                                   username: group.name,
                                   isGroup: true
                                }
                            });
                        }
                    }
                });
            }
        } else {
            // Notify the receiver privately
            const receiverSocketId = onlineUsers.get(receiver.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("new_message_alert", {
                    roomId,
                    message: formattedMsg,
                    chat: {
                       id: sender.toString(),
                       username: "Other", // Placeholder
                       isGroup: false
                    }
                });
            }
            // Notify sender about delivery
            socket.emit("message_status_sent", { id: formattedMsg.id, status: newMessage.status });
        }
        
        // Notify sender to update their own ConversationList
        const updateData = { ...formattedMsg, senderId: sender.toString() };
        if (!groupId) updateData.receiverId = receiver.toString();
        socket.emit("own_message_sent", updateData);

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

    // --- Agora Call Signaling Events ---
    const logCallHistory = async (senderId, receiverId, callType, callStatus) => {
        try {
            const sortedIds = [senderId.toString(), receiverId.toString()].sort();
            const roomId = `${sortedIds[0]}-${sortedIds[1]}`;
            const senderObj = new mongoose.Types.ObjectId(senderId);
            const receiverObj = new mongoose.Types.ObjectId(receiverId);

            const newMessage = await Message.create({
                sender: senderObj,
                receiver: receiverObj,
                roomId,
                text: `${callType === 'video' ? 'Video' : 'Audio'} Call: ${callStatus}`,
                type: "system",
                payload: { isCallLog: true, callType, callStatus },
                status: "delivered"
            });

            const formattedMsg = {
                id: newMessage._id.toString(),
                sender: "other",
                senderId: senderId.toString(),
                text: newMessage.text,
                type: "system",
                payload: newMessage.payload,
                status: newMessage.status,
                seenBy: newMessage.seenBy,
                timestamp: new Date(newMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
            };

            // Emit to receiver
            const receiverSocketId = onlineUsers.get(receiverId.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive_message", formattedMsg);
            }

            // Emit to sender
            const senderSocketId = onlineUsers.get(senderId.toString());
            if (senderSocketId) {
                const updateData = { ...formattedMsg, senderId: senderId.toString(), receiverId: receiverId.toString() };
                io.to(senderSocketId).emit("own_message_sent", updateData);
            }
        } catch (err) {
            console.error("[Socket] Failed to log call history:", err);
        }
    };
    
    // Caller initiates a call
    socket.on("initiate_call", ({ receiverId, channelName, callType, callerData }) => {
        if (!receiverId) return;
        const receiverSocketId = onlineUsers.get(receiverId.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("incoming_call", {
                callerData,
                channelName,
                callType
            });
        } else {
            // Notify caller that user is offline
            socket.emit("call_failed", { reason: "User is offline" });
            logCallHistory(socket.userId || callerData?.id, receiverId, callType, 'Missed');
        }
    });

    // Receiver accepts the call
    socket.on("accept_call", ({ callerId, channelName }) => {
        if (!callerId) return;
        const callerSocketId = onlineUsers.get(callerId.toString());
        if (callerSocketId) {
            io.to(callerSocketId).emit("call_accepted", { channelName });
        }
    });

    // Receiver rejects the call
    socket.on("reject_call", ({ callerId, channelName, callType }) => {
        if (!callerId) return;
        const callerSocketId = onlineUsers.get(callerId.toString());
        if (callerSocketId) {
            io.to(callerSocketId).emit("call_rejected", { channelName });
        }
        logCallHistory(callerId, socket.userId, callType || 'audio', 'Declined');
    });

    // Either party ends the call
    socket.on("end_call", ({ otherUserId, channelName, callType }) => {
        if (!otherUserId) return;
        const otherSocketId = onlineUsers.get(otherUserId.toString());
        if (otherSocketId) {
            io.to(otherSocketId).emit("call_ended", { channelName });
        }
        // Assuming callerId is the person who initiated it, this might be backwards for the receiver.
        // But for a simple log, it works either way. We can pass the person who initiated as sender.
        logCallHistory(socket.userId, otherUserId, callType || 'video', 'Ended');
    });
    // -----------------------------------

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

