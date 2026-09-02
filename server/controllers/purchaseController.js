const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");

const {
  ensureSystemLocations,
  addItemsToLocation,
  rollbackLocationAdds,
} = require("../services/locationStockService");


// Generate a simple purchase number
const generatePurchaseNumber = () => {
  const timestamp = Date.now();

  return `PUR-${timestamp}`;
};


// GET /api/purchases
const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate(
        "supplier",
        "name company phone"
      )
      .populate(
        "items.product",
        "name sku unit"
      )
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases,
    });
  } catch (error) {
    console.error(
      "Get purchases error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch purchases",
    });
  }
};


// GET /api/purchases/:id
const getPurchaseById = async (
  req,
  res
) => {
  try {
    const purchase =
      await Purchase.findById(
        req.params.id
      )
        .populate(
          "supplier",
          "name company phone email address"
        )
        .populate(
          "items.product",
          "name sku unit category"
        );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message:
          "Purchase not found",
      });
    }

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    console.error(
      "Get purchase error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid purchase ID",
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch purchase",
    });
  }
};


// POST /api/purchases
const createPurchase = async (
  req,
  res
) => {
  try {
    const {
      supplier,
      invoiceNumber,
      items,
      purchaseDate,
      notes,
    } = req.body;

    if (!supplier) {
      return res.status(400).json({
        success: false,
        message:
          "Supplier is required",
      });
    }

    const supplierRecord =
      await Supplier.findById(
        supplier
      );

    if (!supplierRecord) {
      return res.status(404).json({
        success: false,
        message:
          "Supplier not found",
      });
    }

    if (
      supplierRecord.status !==
      "active"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot create purchase for an inactive supplier",
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one product is required",
      });
    }

    const purchaseItems = [];
    let totalAmount = 0;

    const usedProducts =
      new Set();

    for (const item of items) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message:
            "Each purchase item must contain a product",
        });
      }

      if (
        usedProducts.has(
          item.product
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The same product cannot be added twice",
        });
      }

      usedProducts.add(
        item.product
      );

      const quantity =
        Number(item.quantity);

      const purchasePrice =
        Number(
          item.purchasePrice
        );

      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product quantity must be a positive whole number",
        });
      }

      if (
        !Number.isFinite(
          purchasePrice
        ) ||
        purchasePrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Enter a valid purchase price",
        });
      }

      const product =
        await Product.findById(
          item.product
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "One of the selected products was not found",
        });
      }

      if (
        product.status !==
        "active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${product.name} is inactive`,
        });
      }

      const subtotal =
        quantity *
        purchasePrice;

      totalAmount +=
        subtotal;

      purchaseItems.push({
        product:
          product._id,
        productName:
          product.name,
        sku:
          product.sku,
        quantity,
        purchasePrice,
        subtotal,
      });
    }

    const purchase =
      await Purchase.create({
        purchaseNumber:
          generatePurchaseNumber(),

        supplier:
          supplierRecord._id,

        supplierName:
          supplierRecord.name,

        invoiceNumber:
          invoiceNumber?.trim() ||
          "",

        items:
          purchaseItems,

        totalAmount,

        purchaseDate:
          purchaseDate ||
          new Date(),

        notes:
          notes?.trim() ||
          "",

        status:
          "received",
      });

    let warehouseId = null;
    let locationAdds = [];

    try {
      const stockOperations =
        purchaseItems.map(
          (item) => ({
            updateOne: {
              filter: {
                _id:
                  item.product,
              },

              update: {
                $inc: {
                  quantity:
                    item.quantity,
                },
              },
            },
          })
        );

      await Product.bulkWrite(
        stockOperations
      );

      const locations =
        await ensureSystemLocations();

      warehouseId =
        locations.warehouse._id;

      locationAdds =
        await addItemsToLocation(
          purchaseItems,
          warehouseId
        );
    } catch (stockError) {
      const rollbackOperations =
        purchaseItems.map(
          (item) => ({
            updateOne: {
              filter: {
                _id:
                  item.product,
                quantity: {
                  $gte:
                    item.quantity,
                },
              },

              update: {
                $inc: {
                  quantity:
                    -item.quantity,
                },
              },
            },
          })
        );

      try {
        await Product.bulkWrite(
          rollbackOperations
        );
      } catch (
        rollbackProductError
      ) {
        console.error(
          "Purchase product rollback error:",
          rollbackProductError
        );
      }

      if (
        warehouseId &&
        locationAdds.length > 0
      ) {
        try {
          await rollbackLocationAdds(
            locationAdds,
            warehouseId
          );
        } catch (
          rollbackLocationError
        ) {
          console.error(
            "Purchase location rollback error:",
            rollbackLocationError
          );
        }
      }

      await Purchase.findByIdAndDelete(
        purchase._id
      );

      throw stockError;
    }

    const populatedPurchase =
      await Purchase.findById(
        purchase._id
      )
        .populate(
          "supplier",
          "name company phone"
        )
        .populate(
          "items.product",
          "name sku unit"
        );

    res.status(201).json({
      success: true,
      message:
        "Purchase created and stock received into Main Warehouse successfully",
      data:
        populatedPurchase,
    });
  } catch (error) {
    console.error(
      "Create purchase error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid supplier or product ID",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      const messages =
        Object.values(
          error.errors
        ).map(
          (err) =>
            err.message
        );

      return res.status(400).json({
        success: false,
        message:
          messages.join(", "),
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Duplicate purchase number. Please try again.",
      });
    }

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create purchase",
    });
  }
};


module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
};
