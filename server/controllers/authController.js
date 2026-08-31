const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
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
      role:
        role &&
        ["admin", "manager", "cashier"].includes(role)
          ? role
          : "admin",
    });

    const token = generateToken(
      user._id
    );

    res.status(201).json({
      success: true,
      message:
        "User registered successfully",

      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },

        token,
      },
    });
  } catch (error) {
    console.error(
      "Register user error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
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
      message:
        "Failed to register user",
    });
  }
};

// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive",
      });
    }

    const isPasswordCorrect =
      await user.comparePassword(
        password
      );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    const token = generateToken(
      user._id
    );

    res.status(200).json({
      success: true,
      message:
        "Login successful",

      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },

        token,
      },
    });
  } catch (error) {
    console.error(
      "Login user error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to login",
    });
  }
};

// GET /api/auth/me
const getCurrentUser = async (
  req,
  res
) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error(
      "Get current user error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to get current user",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};