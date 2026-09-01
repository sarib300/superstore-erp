const express = require("express");

const {
  getDashboardSummary,
} = require("../controllers/dashboardController");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.use(
  authorizeRoles(
    "admin",
    "manager",
    "cashier",
    "inventory_staff"
  )
);

router.get("/", getDashboardSummary);

module.exports = router;
