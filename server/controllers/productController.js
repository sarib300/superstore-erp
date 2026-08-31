const Product = require("../models/Product");

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      purchasePrice,
      sellingPrice,
      quantity,
      minimumStockLevel,
      supplier,
      unit,
      description,
      status,
    } = req.body;

    if (!name || !sku) {
      return res.status(400).json({
        success: false,
        message: "Product name and SKU are required",
      });
    }

    const existingProduct = await Product.findOne({
      sku: sku.trim().toUpperCase(),
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "A product with this SKU already exists",
      });
    }

    if (
      purchasePrice !== undefined &&
      sellingPrice !== undefined &&
      Number(sellingPrice) < Number(purchasePrice)
    ) {
      return res.status(400).json({
        success: false,
        message: "Selling price cannot be lower than purchase price",
      });
    }

    const product = await Product.create({
      name,
      sku,
      category,
      purchasePrice,
      sellingPrice,
      quantity,
      minimumStockLevel,
      supplier,
      unit,
      description,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A product with this SKU already exists",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err) => err.message
      );

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      purchasePrice,
      sellingPrice,
      quantity,
      minimumStockLevel,
      supplier,
      unit,
      description,
      status,
    } = req.body;

    if (
      purchasePrice !== undefined &&
      sellingPrice !== undefined &&
      Number(sellingPrice) < Number(purchasePrice)
    ) {
      return res.status(400).json({
        success: false,
        message: "Selling price cannot be lower than purchase price",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (sku) {
      const normalizedSku = sku.trim().toUpperCase();

      const duplicateProduct = await Product.findOne({
        sku: normalizedSku,
        _id: { $ne: req.params.id },
      });

      if (duplicateProduct) {
        return res.status(409).json({
          success: false,
          message: "A product with this SKU already exists",
        });
      }

      product.sku = normalizedSku;
    }

    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;
    if (purchasePrice !== undefined) {
      product.purchasePrice = purchasePrice;
    }
    if (sellingPrice !== undefined) {
      product.sellingPrice = sellingPrice;
    }
    if (quantity !== undefined) product.quantity = quantity;
    if (minimumStockLevel !== undefined) {
      product.minimumStockLevel = minimumStockLevel;
    }
    if (supplier !== undefined) product.supplier = supplier;
    if (unit !== undefined) product.unit = unit;
    if (description !== undefined) product.description = description;
    if (status !== undefined) product.status = status;

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err) => err.message
      );

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};

// PATCH /api/products/:id/stock
const adjustStock = async (req, res) => {
  try {
    const { type, quantity } = req.body;

    // Validate type
    if (!["in", "out"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Stock type must be either 'in' or 'out'",
      });
    }

    const adjustmentQuantity = Number(quantity);

    // Validate quantity
    if (
      !Number.isFinite(adjustmentQuantity) ||
      adjustmentQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // STOCK IN
    if (type === "in") {
      product.quantity += adjustmentQuantity;
    }

    // STOCK OUT
    if (type === "out") {
      if (adjustmentQuantity > product.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Only ${product.quantity} ${product.unit} available.`,
        });
      }

      product.quantity -= adjustmentQuantity;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message:
        type === "in"
          ? "Stock added successfully"
          : "Stock removed successfully",
      data: product,
    });
  } catch (error) {
    console.error("Adjust stock error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err) => err.message
      );

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to adjust stock",
    });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  deleteProduct,
};