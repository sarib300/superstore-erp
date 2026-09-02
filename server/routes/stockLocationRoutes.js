const express = require("express");

const {
  getLocations,
  createLocation,
  updateLocation,
  getLocationStock,
  getTransfers,
  createTransfer,
  syncExistingStock,
} = require("../controllers/stockLocationController");

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
    "inventory_staff"
  )
);


// Transfers must be declared before /:id
router.get(
  "/transfers",
  getTransfers
);

router.post(
  "/transfers",
  createTransfer
);

router.post(
  "/sync-existing",
  syncExistingStock
);


router.get(
  "/",
  getLocations
);

router.post(
  "/",
  createLocation
);

router.get(
  "/:id/stock",
  getLocationStock
);

router.put(
  "/:id",
  updateLocation
);


module.exports = router;
