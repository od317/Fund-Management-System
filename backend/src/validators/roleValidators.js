// src/validators/roleValidators.js

const createRoleSchema = {
  name: {
    notEmpty: {
      errorMessage: "Role name is required",
    },
    isString: true,
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: "Role name must be 2-50 characters",
    },
  },
  description: {
    optional: true,
    isString: true,
    isLength: {
      options: { max: 255 },
      errorMessage: "Description must be less than 255 characters",
    },
  },
  permissions: {
    optional: true,
    isObject: {
      errorMessage: "Permissions must be a JSON object",
    },
  },
};

const updateRoleSchema = {
  name: {
    optional: true,
    isString: true,
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: "Role name must be 2-50 characters",
    },
  },
  description: {
    optional: true,
    isString: true,
  },
  permissions: {
    optional: true,
    isObject: {
      errorMessage: "Permissions must be a JSON object",
    },
  },
};

module.exports = { createRoleSchema, updateRoleSchema };
