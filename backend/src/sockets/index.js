// src/sockets/index.js

const jwt = require("jsonwebtoken");

module.exports = (io, prisma) => {
  // Store connected users: userId -> socketId
  const connectedUsers = new Map();

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { role: true },
      });

      if (!user || !user.isActive) {
        return next(new Error("User not found or disabled"));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`🟢 User connected: ${user.fullName} (${user.role.name})`);

    // Store user connection
    connectedUsers.set(user.id, socket.id);

    // Join user-specific room
    socket.join(`user:${user.id}`);

    // Join role-specific rooms
    socket.join(`role:${user.role.name}`);

    // Admin gets all role rooms
    if (user.role.permissions.all) {
      socket.join("role:Admin");
      socket.join("role:Finance Manager");
      socket.join("role:Investor");
    }

    // Handle manual room join requests
    socket.on("join:room", (room) => {
      socket.join(room);
      console.log(`${user.fullName} joined room: ${room}`);
    });

    socket.on("leave:room", (room) => {
      socket.leave(room);
      console.log(`${user.fullName} left room: ${room}`);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`🔴 User disconnected: ${user.fullName}`);
      connectedUsers.delete(user.id);
    });
  });

  // Utility functions to emit events

  /**
   * Send event to specific user
   */
  const emitToUser = async (userId, event, data) => {
    const socketId = connectedUsers.get(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
    }

    // Also emit to user's room (in case they have multiple connections)
    io.to(`user:${userId}`).emit(event, data);
  };

  /**
   * Send event to all users with a specific role
   */
  const emitToRole = (role, event, data) => {
    io.to(`role:${role}`).emit(event, data);
  };

  /**
   * Send event to all connected users
   */
  const emitToAll = (event, data) => {
    io.emit(event, data);
  };

  /**
   * Check if user is online
   */
  const isUserOnline = (userId) => {
    return connectedUsers.has(userId);
  };

  return {
    emitToUser,
    emitToRole,
    emitToAll,
    isUserOnline,
  };
};
