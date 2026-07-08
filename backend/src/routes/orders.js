// src/routes/orders.js

const express = require("express");
const router = express.Router();
const { authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  createOrderSchema,
  updateOrderSchema,
  rejectOrderSchema,
} = require("../validators/orderValidators");
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  submitOrder,
  approveOrder,
  rejectOrder,
  executeOrder,
  getMyOrders,
  getPendingOrders,
} = require("../controllers/orderController");

// All routes require authentication (applied in index.js)

// Get routes (different permissions)
router.get("/my-orders", getMyOrders);
router.get("/pending", authorize("approve_orders"), getPendingOrders);
router.get("/", authorize("view_all_orders"), getOrders);
router.get("/:id", getOrder);

// Create and modify routes
router.post(
  "/",
  authorize("create_orders"),
  validate(createOrderSchema),
  createOrder,
);
router.put(
  "/:id",
  authorize("edit_orders"),
  validate(updateOrderSchema),
  updateOrder,
);
router.delete("/:id", authorize("delete_orders"), deleteOrder);

// Workflow routes
router.post("/:id/submit", submitOrder);
router.post("/:id/approve", authorize("approve_orders"), approveOrder);
router.post(
  "/:id/reject",
  authorize("approve_orders"),
  validate(rejectOrderSchema),
  rejectOrder,
);
router.post("/:id/execute", authorize("execute_orders"), executeOrder);

module.exports = router;
