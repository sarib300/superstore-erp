const express = require("express");

const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
} = require(
  "../controllers/userController"
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

// Every users route requires login
router.use(protect);

// Every users route requires admin
router.use(
  authorizeRoles("admin")
);

router.get(
  "/",
  getUsers
);

router.get(
  "/:id",
  getUserById
);

router.post(
  "/",
  createUser
);

router.put(
  "/:id",
  updateUser
);

router.patch(
  "/:id/password",
  resetUserPassword
);

module.exports = router;