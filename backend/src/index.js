// src/index.js

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Initialize Prisma
const prisma = new PrismaClient();

// Import middleware
const { authenticate } = require("./middleware/auth");
const { errorHandler } = require("./middleware/errorHandler");
const { auditLogger } = require("./middleware/auditLogger");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const roleRoutes = require("./routes/roles");
const categoryRoutes = require("./routes/categories");
const orderRoutes = require("./routes/orders");
const documentRoutes = require("./routes/documents");

// Initialize Express
const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io and prisma accessible to routes
app.set("io", io);
app.set("prisma", prisma);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Audit logging middleware
app.use(auditLogger);

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================
app.use("/api/auth", authRoutes);
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    message: "Cash Management API is running",
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// AUTHENTICATION WALL - Everything below requires valid token
// ==========================================
app.use("/api", authenticate);

// ==========================================
// PROTECTED ROUTES (Authentication required)
// ==========================================
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/documents", documentRoutes);

// Test protected route
app.get("/api/test-protected", (req, res) => {
  res.json({
    message: "You are authenticated!",
    user: req.user.fullName,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling
app.use(errorHandler);

// Socket.IO connection handling
require("./sockets")(io, prisma);

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(
    `🛡️  Protected routes: /api/users, /api/roles, /api/categories\n`,
  );
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n👋 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n👋 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = { app, prisma, io };
