// src/validators/orderValidators.js

const createOrderSchema = {
  type: {
    notEmpty: {
      errorMessage: "Order type is required",
    },
    isIn: {
      options: [["INCOME", "EXPENSE"]],
      errorMessage: "Type must be INCOME or EXPENSE",
    },
  },
  description: {
    optional: true,
    isString: true,
    isLength: {
      options: { max: 1000 },
      errorMessage: "Description must be less than 1000 characters",
    },
  },
  orderDate: {
    optional: true,
    isISO8601: {
      errorMessage: "Invalid date format",
    },
  },
  reference: {
    optional: true,
    isString: true,
    isLength: {
      options: { max: 100 },
      errorMessage: "Reference must be less than 100 characters",
    },
  },
  notes: {
    optional: true,
    isString: true,
  },
  items: {
    optional: true,
    isArray: {
      errorMessage: "Items must be an array",
    },
  },
};

const updateOrderSchema = {
  type: {
    optional: true,
    isIn: {
      options: [["INCOME", "EXPENSE"]],
      errorMessage: "Type must be INCOME or EXPENSE",
    },
  },
  description: {
    optional: true,
    isString: true,
  },
  orderDate: {
    optional: true,
    isISO8601: true,
  },
  reference: {
    optional: true,
    isString: true,
  },
  notes: {
    optional: true,
    isString: true,
  },
};

const rejectOrderSchema = {
  reason: {
    notEmpty: {
      errorMessage: "Rejection reason is required",
    },
    isString: true,
  },
};

module.exports = { createOrderSchema, updateOrderSchema, rejectOrderSchema };
