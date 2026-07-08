// src/middleware/validate.js

const { validationResult, checkSchema } = require("express-validator");

const validate = (schema) => {
  return [
    // Use checkSchema to process the schema
    checkSchema(schema),

    // Check for validation errors
    (req, res, next) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array().map((err) => ({
            field: err.path,
            message: err.msg,
            value: err.value,
          })),
        });
      }

      next();
    },
  ];
};

module.exports = { validate };
