const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (
  req,
  res,
  next
) => {
  try {
    let token;

    const authorization =
      req.headers.authorization;

    if (
      authorization &&
      authorization.startsWith(
        "Bearer "
      )
    ) {
      token =
        authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Not authorized. Token missing.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user =
      await User.findById(
        decoded.id
      ).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "User no longer exists",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message:
          "User account is inactive",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error(
      "Auth middleware error:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Not authorized. Invalid or expired token.",
    });
  }
};

module.exports = {
  protect,
};