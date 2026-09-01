const express = require("express");

const {
  getReports,
} = require(
  "../controllers/reportController"
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


const router =
  express.Router();


router.use(protect);


router.get(
  "/",
  authorizeRoles(
    "admin",
    "manager"
  ),
  getReports
);


module.exports =
  router;