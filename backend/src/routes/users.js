// src/routes/users.js

const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  createUserSchema,
  updateUserSchema,
} = require("../validators/userValidators");
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} = require("../controllers/userController");

// Apply authentication to EACH route individually
router.get("/", authenticate, authorize("manage_users"), getUsers);
router.get("/:id", authenticate, authorize("manage_users"), getUser);
router.post(
  "/",
  authenticate,
  authorize("manage_users"),
  validate(createUserSchema),
  createUser,
);
router.put(
  "/:id",
  authenticate,
  authorize("manage_users"),
  validate(updateUserSchema),
  updateUser,
);
router.delete("/:id", authenticate, authorize("manage_users"), deleteUser);
router.put(
  "/:id/toggle-status",
  authenticate,
  authorize("manage_users"),
  toggleUserStatus,
);

module.exports = router;
