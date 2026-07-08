// src/validators/categoryValidators.js

const createCategorySchema = {
  name: {
    notEmpty: {
      errorMessage: "Category name is required",
    },
    isString: true,
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: "Category name must be 2-100 characters",
    },
  },
  type: {
    notEmpty: {
      errorMessage: "Category type is required",
    },
    isIn: {
      options: [["INCOME", "EXPENSE"]],
      errorMessage: "Type must be INCOME or EXPENSE",
    },
  },
  parentId: {
    optional: true,
    isInt: {
      errorMessage: "Parent ID must be a valid number",
    },
  },
  description: {
    optional: true,
    isString: true,
    isLength: {
      options: { max: 500 },
      errorMessage: "Description must be less than 500 characters",
    },
  },
};

const updateCategorySchema = {
  name: {
    optional: true,
    isString: true,
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: "Category name must be 2-100 characters",
    },
  },
  type: {
    optional: true,
    isIn: {
      options: [["INCOME", "EXPENSE"]],
      errorMessage: "Type must be INCOME or EXPENSE",
    },
  },
  parentId: {
    optional: true,
    isInt: true,
  },
  description: {
    optional: true,
    isString: true,
  },
  isActive: {
    optional: true,
    isBoolean: {
      errorMessage: "isActive must be a boolean",
    },
  },
};

module.exports = { createCategorySchema, updateCategorySchema };
