// src/routes/dashboard.js

const express = require("express");
const router = express.Router();
const {
  getAdminDashboard,
  getInvestorDashboard,
  getFinanceManagerDashboard,
  getEmployeeDashboard,
  getClientDashboard,
} = require("../controllers/dashboardController");

// Admin dashboard
router.get("/admin", getAdminDashboard);

// Investor dashboard (Admin can also access)
router.get("/investor", getInvestorDashboard);

// Finance Manager dashboard
router.get("/finance-manager", getFinanceManagerDashboard);

// Employee dashboard
router.get("/employee", getEmployeeDashboard);

// Client dashboard
router.get("/client", getClientDashboard);

module.exports = router;
