const User = require("../models/User");


// GET /api/users
// Admin only
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};


// GET /api/users/:id
// Admin only
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};


// POST /api/users
// Admin creates staff account
const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      status,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    const allowedRoles = [
      "admin",
      "manager",
      "cashier",
      "inventory_staff",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists",
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      status:
        status === "inactive"
          ? "inactive"
          : "active",
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",

      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(
        error.errors
      ).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};


// PUT /api/users/:id
// Change staff name / email / role / status
const updateUser = async (req, res) => {
  try {
    const {
      name,
      email,
      role,
      status,
    } = req.body;

    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const allowedRoles = [
      "admin",
      "manager",
      "cashier",
      "inventory_staff",
    ];

    if (
      role !== undefined &&
      !allowedRoles.includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    if (
      status !== undefined &&
      !["active", "inactive"].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user status",
      });
    }

    // Prevent admin from deactivating their own account
    if (
      user._id.toString() ===
        req.user._id.toString() &&
      status === "inactive"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot deactivate your own account",
      });
    }

    // Prevent admin from removing their own admin role
    if (
      user._id.toString() ===
        req.user._id.toString() &&
      role &&
      role !== "admin"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot remove your own admin role",
      });
    }

    if (email !== undefined) {
      const normalizedEmail =
        email.trim().toLowerCase();

      const duplicateUser =
        await User.findOne({
          email: normalizedEmail,
          _id: {
            $ne: user._id,
          },
        });

      if (duplicateUser) {
        return res.status(409).json({
          success: false,
          message:
            "A user with this email already exists",
        });
      }

      user.email = normalizedEmail;
    }

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (role !== undefined) {
      user.role = role;
    }

    if (status !== undefined) {
      user.status = status;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",

      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(
        error.errors
      ).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};


// PATCH /api/users/:id/password
// Admin resets user password
const resetUserPassword = async (
  req,
  res
) => {
  try {
    const { password } = req.body;

    if (
      !password ||
      password.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
    }

    const user = await User.findById(
      req.params.id
    ).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = password;

    await user.save();

    res.status(200).json({
      success: true,
      message:
        "User password reset successfully",
    });
  } catch (error) {
    console.error(
      "Reset user password error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Failed to reset user password",
    });
  }
};


module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
};