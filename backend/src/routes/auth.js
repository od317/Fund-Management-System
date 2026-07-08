// src/routes/auth.js

const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  loginSchema,
  registerSchema,
  changePasswordSchema,
} = require("../validators/authValidators");
const {
  login,
  logout,
  refreshToken,
  getMe,
  changePassword,
  register,
} = require("../controllers/authController");

// Public routes (no auth required)
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);

// Protected routes (auth required for EACH)
router.get("/me", authenticate, getMe);
router.put(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changePassword,
);
router.post(
  "/register",
  authenticate,
  authorize("manage_users"),
  validate(registerSchema),
  register,
);

module.exports = router;
