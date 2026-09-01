const express = require("express");

const {
  getReturns,
  getReturnById,
  getReturnableSale,
  createReturn,
} = require(
  "../controllers/returnController"
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


// View return history
router.get(
  "/",
  authorizeRoles(
    "admin",
    "manager",
    "cashier"
  ),
  getReturns
);


// Get products still returnable
// from a particular sale
router.get(
  "/sale/:saleId",
  authorizeRoles(
    "admin",
    "manager",
    "cashier"
  ),
  getReturnableSale
);


// View single return
router.get(
  "/:id",
  authorizeRoles(
    "admin",
    "manager",
    "cashier"
  ),
  getReturnById
);


// Process return
router.post(
  "/",
  authorizeRoles(
    "admin",
    "manager",
    "cashier"
  ),
  createReturn
);


module.exports = router;