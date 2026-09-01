const express = require("express");

const {
  loginUser,
  getCurrentUser,
} = require(
  "../controllers/authController"
);

const {
  protect,
} = require(
  "../middleware/authMiddleware"
);

const router = express.Router();

router.post(
  "/login",
  loginUser
);

router.get(
  "/me",
  protect,
  getCurrentUser
);

module.exports = router;