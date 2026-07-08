// src/routes/categories.js

const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../validators/categoryValidators");
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

// Apply authentication to EACH route individually
router.get("/", authenticate, getCategories);
router.get("/:id", authenticate, getCategory);
router.post(
  "/",
  authenticate,
  authorize("manage_categories"),
  validate(createCategorySchema),
  createCategory,
);
router.put(
  "/:id",
  authenticate,
  authorize("manage_categories"),
  validate(updateCategorySchema),
  updateCategory,
);
router.delete(
  "/:id",
  authenticate,
  authorize("manage_categories"),
  deleteCategory,
);

module.exports = router;
