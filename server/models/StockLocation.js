const mongoose = require("mongoose");

const stockLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Location name is required"],
      trim: true,
      maxlength: [100, "Location name cannot exceed 100 characters"],
    },

    code: {
      type: String,
      required: [true, "Location code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [30, "Location code cannot exceed 30 characters"],
    },

    type: {
      type: String,
      enum: ["warehouse", "store", "counter", "other"],
      default: "warehouse",
    },

    address: {
      type: String,
      trim: true,
      default: "",
      maxlength: [250, "Address cannot exceed 250 characters"],
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    systemLocation: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "StockLocation",
  stockLocationSchema
);
