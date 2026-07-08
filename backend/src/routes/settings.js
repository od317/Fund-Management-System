// src/routes/settings.js

const express = require("express");
const router = express.Router();
const { authorize } = require("../middleware/auth");
const {
  getCompanySettings,
  updateCompanySettings,
} = require("../controllers/settingsController");

router.get("/company", getCompanySettings);
router.put("/company", authorize("system_settings"), updateCompanySettings);

module.exports = router;
