const express = require("express");

const {
  getCustomers,
  getCustomerById,
  getCustomerHistory,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);


// View customers
router.get(
  "/",
  authorizeRoles(
    "admin",
    "manager",
    "cashier"
  ),
  getCustomers
);


// Customer purchase history
router.get(
  "/:id/history",
  authorizeRoles(
    "admin",
    "manager",
    "cashier"
  ),
  getCustomerHistory
);


// View single customer
router.get(
  "/:id",
  authorizeRoles(
    "admin",
    "manager",
    "cashier"
  ),
  getCustomerById
);


// Create customer
router.post(
  "/",
  authorizeRoles(
    "admin",
    "manager",
    "cashier"
  ),
  createCustomer
);


// Edit customer
router.put(
  "/:id",
  authorizeRoles(
    "admin",
    "manager"
  ),
  updateCustomer
);


// Delete customer
router.delete(
  "/:id",
  authorizeRoles("admin"),
  deleteCustomer
);


module.exports = router;