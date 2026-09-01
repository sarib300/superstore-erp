const express = require("express");

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct,
} = require("../controllers/productController");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authorizeRoles,
} = require("../middleware/roleMiddleware");

const router = express.Router();

// Every product route requires login
router.use(protect);


// ===============================
// READ PRODUCTS
// Cashier needs this for POS
// ===============================

router.get(
  "/",
  authorizeRoles(
    "admin",
    "manager",
    "inventory_staff",
    "cashier"
  ),
  getProducts
);

router.get(
  "/:id",
  authorizeRoles(
    "admin",
    "manager",
    "inventory_staff",
    "cashier"
  ),
  getProductById
);


// ===============================
// INVENTORY MANAGEMENT
// Cashier NOT allowed
// ===============================

router.post(
  "/",
  authorizeRoles(
    "admin",
    "manager",
    "inventory_staff"
  ),
  createProduct
);

router.put(
  "/:id",
  authorizeRoles(
    "admin",
    "manager",
    "inventory_staff"
  ),
  updateProduct
);

router.patch(
  "/:id/stock",
  authorizeRoles(
    "admin",
    "manager",
    "inventory_staff"
  ),
  adjustStock
);

router.delete(
  "/:id",
  authorizeRoles(
    "admin",
    "manager",
    "inventory_staff"
  ),
  deleteProduct
);

module.exports = router;