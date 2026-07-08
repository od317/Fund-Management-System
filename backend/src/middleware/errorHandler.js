// src/middleware/errorHandler.js

const { Prisma } = require("@prisma/client");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for development
  console.error("Error:", err);

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        error.message = "Duplicate field value. This record already exists.";
        error.statusCode = 400;
        break;
      case "P2025":
        error.message = "Record not found.";
        error.statusCode = 404;
        break;
      case "P2003":
        error.message = "Foreign key constraint failed.";
        error.statusCode = 400;
        break;
      default:
        error.message = "Database error occurred.";
        error.statusCode = 500;
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    error.message = "Invalid data provided.";
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error.message = "Invalid token.";
    error.statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    error.message = "Token expired.";
    error.statusCode = 401;
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
