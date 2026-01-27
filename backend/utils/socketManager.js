import { Server } from "socket.io";

const rooms = new Map(); // roomName -> set of socketIds

export const initSocket = (server, allowedOrigins) => {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("join-room", ({ roomName, userName, userAvatar }) => {
      if (!rooms.has(roomName)) {
        rooms.set(roomName, new Set());
      }

      const room = rooms.get(roomName);
      if (room.size >= 8) {
        socket.emit("room-full", { roomName });
        return;
      }

      room.add(socket.id);
      socket.join(roomName);
      
      // Store user info on socket
      socket.userName = userName;
      socket.userAvatar = userAvatar;
      socket.roomName = roomName;

      console.log(`User ${userName} joined room ${roomName}`);

      // Tell others in the room that a new user joined
      const otherUsers = Array.from(room).filter(id => id !== socket.id).map(id => {
        const s = io.sockets.sockets.get(id);
        return {
          id: id,
          name: s?.userName,
          avatar: s?.userAvatar
        };
      });

      socket.emit("all-users", otherUsers);
      
      // Update global call status
      io.emit("call-status-update", {
        hasOngoingCalls: rooms.size > 0 && Array.from(rooms.values()).some(r => r.size > 0)
      });
    });

    socket.on("sending-signal", (payload) => {
      io.to(payload.userToSignal).emit("user-joined", {
        signal: payload.signal,
        callerId: payload.callerId,
        name: socket.userName,
        avatar: socket.userAvatar
      });
    });

    socket.on("returning-signal", (payload) => {
      io.to(payload.callerId).emit("receiving-returned-signal", {
        signal: payload.signal,
        id: socket.id
      });
    });

    const leaveRoom = () => {
      const roomName = socket.roomName;
      if (roomName && rooms.has(roomName)) {
        const room = rooms.get(roomName);
        room.delete(socket.id);
        if (room.size === 0) {
          rooms.delete(roomName);
        }
        socket.to(roomName).emit("user-left", socket.id);
        console.log(`User ${socket.userName} left room ${roomName}`);
        socket.roomName = null;
      }

      io.emit("call-status-update", {
        hasOngoingCalls: rooms.size > 0 && Array.from(rooms.values()).some(r => r.size > 0)
      });
    };

    socket.on("leave-room", leaveRoom);
    socket.on("disconnect", leaveRoom);

    // Request current call status
    socket.on("get-call-status", () => {
      socket.emit("call-status-update", {
        hasOngoingCalls: rooms.size > 0 && Array.from(rooms.values()).some(r => r.size > 0)
      });
    });

    socket.on("get-active-rooms", () => {
      const activeRooms = Array.from(rooms.entries())
        .filter(([_, set]) => set.size > 0)
        .map(([name, set]) => ({
          name,
          count: set.size
        }));
      socket.emit("active-rooms-update", activeRooms);
    });
  });

  return io;
};
