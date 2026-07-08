// src/validators/documentValidators.js

const uploadDocumentSchema = {
  orderId: {
    optional: true,
    isInt: {
      errorMessage: "Order ID must be a valid number",
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

module.exports = { uploadDocumentSchema };
