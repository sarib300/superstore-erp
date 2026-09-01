const express = require("express");

const {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  cancelExpense,
} = require(
  "../controllers/expenseController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const {
  authorizeRoles,
} = require(
  "../middleware/roleMiddleware"
);


const router = express.Router();

router.use(protect);


// View expenses
router.get(
  "/",
  authorizeRoles(
    "admin",
    "manager"
  ),
  getExpenses
);


// View single expense
router.get(
  "/:id",
  authorizeRoles(
    "admin",
    "manager"
  ),
  getExpenseById
);


// Create expense
router.post(
  "/",
  authorizeRoles(
    "admin",
    "manager"
  ),
  createExpense
);


// Edit expense
router.put(
  "/:id",
  authorizeRoles(
    "admin",
    "manager"
  ),
  updateExpense
);


// Cancel expense
router.patch(
  "/:id/cancel",
  authorizeRoles(
    "admin",
    "manager"
  ),
  cancelExpense
);


module.exports = router;