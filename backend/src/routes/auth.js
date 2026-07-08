// src/routes/auth.js

const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  login,
  logout,
  refreshToken,
  getMe,
  changePassword,
  register,
} = require("../controllers/authController");

// TEST: Simple route without any middleware
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Auth test route works!" });
});

// Login WITHOUT validation for testing
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/me", authenticate, getMe);

module.exports = router;
