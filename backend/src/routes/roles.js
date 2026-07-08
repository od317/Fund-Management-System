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

// All routes require authentication
router.use(authenticate);

router
  .route("/")
  .get(authorize("manage_roles"), getRoles)
  .post(authorize("manage_roles"), validate(createRoleSchema), createRole);

router
  .route("/:id")
  .get(authorize("manage_roles"), getRole)
  .put(authorize("manage_roles"), validate(updateRoleSchema), updateRole)
  .delete(authorize("manage_roles"), deleteRole);

module.exports = router;
