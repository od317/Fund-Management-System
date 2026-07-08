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

// All routes require authentication
router.use(authenticate);

// User routes (Admin only for most actions)
router
  .route("/")
  .get(authorize("manage_users"), getUsers)
  .post(authorize("manage_users"), validate(createUserSchema), createUser);

router
  .route("/:id")
  .get(authorize("manage_users"), getUser)
  .put(authorize("manage_users"), validate(updateUserSchema), updateUser)
  .delete(authorize("manage_users"), deleteUser);

router.put("/:id/toggle-status", authorize("manage_users"), toggleUserStatus);

module.exports = router;
