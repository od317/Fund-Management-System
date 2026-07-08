// src/middleware/auditLogger.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const auditLogger = async (req, res, next) => {
  // Store original send function
  const originalSend = res.send;

  // Override send function
  res.send = function (data) {
    // Log after response is sent
    const logAction = async () => {
      try {
        // Only log for modifying requests
        const methodsToLog = ["POST", "PUT", "PATCH", "DELETE"];

        if (methodsToLog.includes(req.method) && req.user) {
          // Skip logging for certain paths
          const skipPaths = [
            "/api/auth/login",
            "/api/auth/refresh-token",
            "/api/auth/me",
          ];

          if (!skipPaths.includes(req.path)) {
            // Determine action
            let action = "";
            switch (req.method) {
              case "POST":
                action = "CREATE";
                break;
              case "PUT":
              case "PATCH":
                action = "UPDATE";
                break;
              case "DELETE":
                action = "DELETE";
                break;
              default:
                action = req.method;
            }

            // Extract table name from URL
            const tableName = req.path.split("/")[2] || "unknown";

            // Get record ID if exists
            const recordId = req.params.id ? parseInt(req.params.id) : null;

            // Create audit log
            await prisma.auditLog.create({
              data: {
                userId: req.user.id,
                action,
                tableName,
                recordId,
                newData: req.body,
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"],
              },
            });
          }
        }
      } catch (error) {
        console.error("Audit logging error:", error);
      }
    };

    // Execute logging asynchronously
    logAction();

    // Call original send
    originalSend.call(this, data);
  };

  next();
};

module.exports = { auditLogger };
