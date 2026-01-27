import { Server } from "socket.io";

// ============================================
// VOICE CALL SOCKET MANAGER
// Supports up to 8 participants per room
// ============================================

const rooms = new Map(); // roomName -> Map of socketId -> userInfo
const MAX_PARTICIPANTS = 8;

export const initSocket = (server, allowedOrigins) => {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    },
    // Settings optimized for mobile webviews
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const broadcastActiveRooms = () => {
    const activeRooms = [];
    rooms.forEach((participants, roomName) => {
      if (participants.size > 0) {
        activeRooms.push({
          name: roomName,
          count: participants.size
        });
      }
    });
    io.emit("active-rooms-update", activeRooms);
  };

  const getRoomParticipants = (roomName) => {
    const room = rooms.get(roomName);
    if (!room) return [];
    
    return Array.from(room.entries()).map(([socketId, info]) => ({
      id: socketId,
      name: info.userName,
      avatar: info.userAvatar
    }));
  };

  // ============================================
  // SOCKET CONNECTION HANDLER
  // ============================================
  io.on("connection", (socket) => {
    console.log("[VoiceCall] Client connected:", socket.id);
    
    // Send current active rooms to new client
    broadcastActiveRooms();

    // ------------------------------------
    // JOIN ROOM
    // ------------------------------------
    socket.on("join-room", ({ roomName, userName, userAvatar }) => {
      console.log(`[VoiceCall] ${userName} attempting to join room: ${roomName}`);
      
      // Initialize room if it doesn't exist
      if (!rooms.has(roomName)) {
        rooms.set(roomName, new Map());
      }

      const room = rooms.get(roomName);

      // Check room capacity
      if (room.size >= MAX_PARTICIPANTS) {
        console.log(`[VoiceCall] Room ${roomName} is full`);
        socket.emit("room-full", { roomName });
        return;
      }

      // Leave any previous room first
      if (socket.currentRoom && rooms.has(socket.currentRoom)) {
        leaveCurrentRoom(socket);
      }

      // Add user to room
      room.set(socket.id, { userName, userAvatar });
      socket.join(roomName);
      socket.currentRoom = roomName;
      socket.userName = userName;
      socket.userAvatar = userAvatar;

      console.log(`[VoiceCall] ${userName} joined room ${roomName} (${room.size}/${MAX_PARTICIPANTS})`);

      // Get list of other users in the room (for the new joiner to connect to)
      const otherUsers = [];
      room.forEach((info, socketId) => {
        if (socketId !== socket.id) {
          otherUsers.push({
            id: socketId,
            name: info.userName,
            avatar: info.userAvatar
          });
        }
      });

      // Send existing users to the new joiner
      socket.emit("all-users", otherUsers);
      
      // Update global room list
      broadcastActiveRooms();
      
      // Broadcast call status
      io.emit("call-status-update", {
        hasOngoingCalls: Array.from(rooms.values()).some(r => r.size > 0)
      });
    });

    // ------------------------------------
    // WEBRTC SIGNALING: Send Offer
    // ------------------------------------
    socket.on("sending-signal", (payload) => {
      console.log(`[VoiceCall] Signal from ${socket.id} to ${payload.userToSignal}`);
      
      io.to(payload.userToSignal).emit("user-joined", {
        signal: payload.signal,
        callerId: payload.callerId,
        name: socket.userName,
        avatar: socket.userAvatar
      });
    });

    // ------------------------------------
    // WEBRTC SIGNALING: Return Answer
    // ------------------------------------
    socket.on("returning-signal", (payload) => {
      console.log(`[VoiceCall] Return signal from ${socket.id} to ${payload.callerId}`);
      
      io.to(payload.callerId).emit("receiving-returned-signal", {
        signal: payload.signal,
        id: socket.id
      });
    });

    // ------------------------------------
    // LEAVE ROOM
    // ------------------------------------
    const leaveCurrentRoom = (sock) => {
      const roomName = sock.currentRoom;
      if (!roomName || !rooms.has(roomName)) return;

      const room = rooms.get(roomName);
      room.delete(sock.id);
      
      console.log(`[VoiceCall] ${sock.userName || sock.id} left room ${roomName}`);

      // Notify others in room
      sock.to(roomName).emit("user-left", sock.id);
      sock.leave(roomName);
      
      // Clean up empty rooms
      if (room.size === 0) {
        rooms.delete(roomName);
        console.log(`[VoiceCall] Room ${roomName} deleted (empty)`);
      }

      sock.currentRoom = null;
      
      // Update room list
      broadcastActiveRooms();
      
      // Broadcast call status
      io.emit("call-status-update", {
        hasOngoingCalls: Array.from(rooms.values()).some(r => r.size > 0)
      });
    };

    socket.on("leave-room", () => {
      leaveCurrentRoom(socket);
    });

    // ------------------------------------
    // REQUEST ACTIVE ROOMS
    // ------------------------------------
    socket.on("get-active-rooms", () => {
      broadcastActiveRooms();
    });

    // ------------------------------------
    // REQUEST CALL STATUS
    // ------------------------------------
    socket.on("get-call-status", () => {
      socket.emit("call-status-update", {
        hasOngoingCalls: Array.from(rooms.values()).some(r => r.size > 0)
      });
    });

    // ------------------------------------
    // DISCONNECT
    // ------------------------------------
    socket.on("disconnect", (reason) => {
      console.log(`[VoiceCall] Client disconnected: ${socket.id}, reason: ${reason}`);
      leaveCurrentRoom(socket);
    });
  });

  return io;
};
