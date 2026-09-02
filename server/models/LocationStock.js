const mongoose = require("mongoose");

const locationStockSchema = new mongoose.Schema(
  {
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockLocation",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      min: [0, "Location stock cannot be negative"],
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

locationStockSchema.index(
  {
    location: 1,
    product: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("LocationStock", locationStockSchema);
