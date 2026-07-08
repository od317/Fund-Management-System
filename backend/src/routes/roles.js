// src/routes/roles.js

const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  createRoleSchema,
  updateRoleSchema,
} = require("../validators/roleValidators");
const {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");

// Apply authentication to EACH route individually
router.get("/", authenticate, authorize("manage_roles"), getRoles);
router.get("/:id", authenticate, authorize("manage_roles"), getRole);
router.post(
  "/",
  authenticate,
  authorize("manage_roles"),
  validate(createRoleSchema),
  createRole,
);
router.put(
  "/:id",
  authenticate,
  authorize("manage_roles"),
  validate(updateRoleSchema),
  updateRole,
);
router.delete("/:id", authenticate, authorize("manage_roles"), deleteRole);

module.exports = router;
