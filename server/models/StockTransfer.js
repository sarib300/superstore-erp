const mongoose = require("mongoose");

const stockTransferSchema = new mongoose.Schema(
  {
    transferNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      required: true,
      trim: true,
    },

    fromLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockLocation",
      required: true,
    },

    toLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockLocation",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: [1, "Transfer quantity must be at least 1"],
    },

    transferDate: {
      type: Date,
      default: Date.now,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["completed"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "StockTransfer",
  stockTransferSchema
);
