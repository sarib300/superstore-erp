const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    expenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    title: {
      type: String,
      required: [true, "Expense title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },

    category: {
      type: String,
      required: true,
      enum: [
        "rent",
        "electricity",
        "salary",
        "transport",
        "maintenance",
        "marketing",
        "utilities",
        "supplies",
        "tax",
        "other",
      ],
    },

    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: [0, "Expense amount cannot be negative"],
    },

    expenseDate: {
      type: Date,
      default: Date.now,
    },

    paymentMethod: {
      type: String,
      enum: [
        "cash",
        "card",
        "bank",
        "other",
      ],
      default: "cash",
    },

    vendor: {
      type: String,
      trim: true,
      default: "",
    },

    reference: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: "",
    },

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Expense",
  expenseSchema
);