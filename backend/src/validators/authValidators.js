// src/validators/authValidators.js

const loginSchema = {
  username: {
    notEmpty: {
      errorMessage: "Username is required",
    },
    isString: {
      errorMessage: "Username must be a string",
    },
  },
  password: {
    notEmpty: {
      errorMessage: "Password is required",
    },
    isString: {
      errorMessage: "Password must be a string",
    },
  },
};

const registerSchema = {
  username: {
    notEmpty: {
      errorMessage: "Username is required",
    },
    isString: true,
    isLength: {
      options: { min: 3, max: 50 },
      errorMessage: "Username must be 3-50 characters",
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
  },
  phone: {
    optional: true,
    isString: true,
  },
  roleId: {
    optional: true,
    isInt: {
      errorMessage: "Role ID must be a number",
    },
  },
};

const changePasswordSchema = {
  currentPassword: {
    notEmpty: {
      errorMessage: "Current password is required",
    },
  },
  newPassword: {
    notEmpty: {
      errorMessage: "New password is required",
    },
    isLength: {
      options: { min: 6 },
      errorMessage: "New password must be at least 6 characters",
    },
  },
};

module.exports = { loginSchema, registerSchema, changePasswordSchema };
