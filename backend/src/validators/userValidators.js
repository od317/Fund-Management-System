// src/validators/userValidators.js

const createUserSchema = {
  username: {
    notEmpty: {
      errorMessage: "Username is required",
    },
    isString: true,
    isLength: {
      options: { min: 3, max: 50 },
      errorMessage: "Username must be 3-50 characters",
    },
    matches: {
      options: /^[a-zA-Z0-9_]+$/,
      errorMessage:
        "Username can only contain letters, numbers, and underscores",
    },
  },
  email: {
    notEmpty: {
      errorMessage: "Email is required",
    },
    isEmail: {
      errorMessage: "Please provide a valid email",
    },
  },
  password: {
    notEmpty: {
      errorMessage: "Password is required",
    },
    isLength: {
      options: { min: 6 },
      errorMessage: "Password must be at least 6 characters",
    },
  },
  fullName: {
    notEmpty: {
      errorMessage: "Full name is required",
    },
    isString: true,
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: "Full name must be 2-100 characters",
    },
  },
  phone: {
    optional: true,
    isString: true,
  },
  roleId: {
    notEmpty: {
      errorMessage: "Role ID is required",
    },
    isInt: {
      errorMessage: "Role ID must be a valid number",
    },
  },
};

const updateUserSchema = {
  username: {
    optional: true,
    isString: true,
    isLength: {
      options: { min: 3, max: 50 },
      errorMessage: "Username must be 3-50 characters",
    },
  },
  email: {
    optional: true,
    isEmail: {
      errorMessage: "Please provide a valid email",
    },
  },
  password: {
    optional: true,
    isLength: {
      options: { min: 6 },
      errorMessage: "Password must be at least 6 characters",
    },
  },
  fullName: {
    optional: true,
    isString: true,
    isLength: {
      options: { min: 2, max: 100 },
      errorMessage: "Full name must be 2-100 characters",
    },
  },
  phone: {
    optional: true,
    isString: true,
  },
  roleId: {
    optional: true,
    isInt: {
      errorMessage: "Role ID must be a valid number",
    },
  },
};

module.exports = { createUserSchema, updateUserSchema };
