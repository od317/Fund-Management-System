// src/routes/reports.js

const express = require("express");
const router = express.Router();
const { authorize } = require("../middleware/auth");
const {
  getDailyMovementReport,
  getFinancialSummary,
  getIncomeExpenseAnalysis,
  getOrdersDocumentsStatus,
  getPendingCommitments,
  getAuditLog,
  getUserPermissionsReport,
  getClientTransactionHistory,
} = require("../controllers/reportController");

// Admin reports
router.get(
  "/daily-movement",
  authorize("generate_reports"),
  getDailyMovementReport,
);

router.get(
  "/financial-summary",
  authorize("generate_reports"),
  getFinancialSummary,
);

router.get(
  "/income-expense-analysis",
  authorize("generate_reports"),
  getIncomeExpenseAnalysis,
);

router.get(
  "/orders-documents",
  authorize("generate_reports"),
  getOrdersDocumentsStatus,
);

router.get(
  "/pending-commitments",
  authorize("generate_reports"),
  getPendingCommitments,
);

router.get("/audit-log", authorize("view_audit_logs"), getAuditLog);

router.get(
  "/user-permissions",
  authorize("generate_reports"),
  getUserPermissionsReport,
);

// Client report (accessible by client and above)
router.get("/client-transactions", getClientTransactionHistory);

module.exports = router;
