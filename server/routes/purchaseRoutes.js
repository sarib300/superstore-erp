const express = require("express");

const {
  getPurchases,
  getPurchaseById,
  createPurchase,
} = require("../controllers/purchaseController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getPurchases);
router.get("/:id", getPurchaseById);
router.post("/", createPurchase);

module.exports = router;