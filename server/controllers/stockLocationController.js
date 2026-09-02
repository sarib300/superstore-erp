const StockLocation = require("../models/StockLocation");
const LocationStock = require("../models/LocationStock");
const StockTransfer = require("../models/StockTransfer");
const Product = require("../models/Product");

const {
  ensureSystemLocations,
  ensureProductAllocated,
  getProductLocationTotal,
  addToLocation,
  decreaseSingleLocation,
  reconcileProductLocations,
} = require("../services/locationStockService");


const generateTransferNumber = () => {
  return `TRF-${Date.now()}`;
};


// GET /api/stock-locations
const getLocations = async (req, res) => {
  try {
    await ensureSystemLocations();

    const locations =
      await StockLocation.find()
        .sort({
          systemLocation: -1,
          createdAt: 1,
        })
        .lean();

    const stats =
      await LocationStock.aggregate([
        {
          $group: {
            _id: "$location",
            totalUnits: {
              $sum: "$quantity",
            },
            productCount: {
              $sum: {
                $cond: [
                  {
                    $gt: [
                      "$quantity",
                      0,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

    const statsMap = new Map(
      stats.map((item) => [
        item._id.toString(),
        item,
      ])
    );

    const data = locations.map(
      (location) => {
        const locationStats =
          statsMap.get(
            location._id.toString()
          );

        return {
          ...location,
          totalUnits:
            Number(
              locationStats?.totalUnits ||
                0
            ),
          productCount:
            Number(
              locationStats?.productCount ||
                0
            ),
        };
      }
    );

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(
      "Get stock locations error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch stock locations",
    });
  }
};


// POST /api/stock-locations
const createLocation = async (req, res) => {
  try {
    const {
      name,
      code,
      type,
      address,
      description,
      status,
    } = req.body;

    if (!name?.trim() || !code?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Location name and code are required",
      });
    }

    const existing =
      await StockLocation.findOne({
        code:
          code.trim().toUpperCase(),
      });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "A stock location with this code already exists",
      });
    }

    const location =
      await StockLocation.create({
        name: name.trim(),
        code:
          code.trim().toUpperCase(),
        type:
          type || "warehouse",
        address:
          address?.trim() || "",
        description:
          description?.trim() || "",
        status:
          status || "active",
        systemLocation: false,
      });

    res.status(201).json({
      success: true,
      message:
        "Stock location created successfully",
      data: location,
    });
  } catch (error) {
    console.error(
      "Create stock location error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A stock location with this code already exists",
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
          (item) =>
            item.message
        );

      return res.status(400).json({
        success: false,
        message:
          messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Failed to create stock location",
    });
  }
};


// PUT /api/stock-locations/:id
const updateLocation = async (req, res) => {
  try {
    const location =
      await StockLocation.findById(
        req.params.id
      );

    if (!location) {
      return res.status(404).json({
        success: false,
        message:
          "Stock location not found",
      });
    }

    const {
      name,
      code,
      type,
      address,
      description,
      status,
    } = req.body;

    if (
      code &&
      code.trim().toUpperCase() !==
        location.code
    ) {
      const duplicate =
        await StockLocation.findOne({
          code:
            code.trim().toUpperCase(),
          _id: {
            $ne: location._id,
          },
        });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            "A stock location with this code already exists",
        });
      }
    }

    if (name !== undefined) {
      location.name =
        name.trim();
    }

    if (
      code !== undefined &&
      !location.systemLocation
    ) {
      location.code =
        code.trim().toUpperCase();
    }

    if (
      type !== undefined &&
      !location.systemLocation
    ) {
      location.type = type;
    }

    if (address !== undefined) {
      location.address =
        address.trim();
    }

    if (description !== undefined) {
      location.description =
        description.trim();
    }

    if (status !== undefined) {
      location.status = status;
    }

    await location.save();

    res.status(200).json({
      success: true,
      message:
        "Stock location updated successfully",
      data: location,
    });
  } catch (error) {
    console.error(
      "Update stock location error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid stock location ID",
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Failed to update stock location",
    });
  }
};


// GET /api/stock-locations/:id/stock
const getLocationStock = async (
  req,
  res
) => {
  try {
    const location =
      await StockLocation.findById(
        req.params.id
      );

    if (!location) {
      return res.status(404).json({
        success: false,
        message:
          "Stock location not found",
      });
    }

    const stock =
      await LocationStock.find({
        location:
          location._id,
        quantity: {
          $gt: 0,
        },
      })
        .populate(
          "product",
          "name sku category unit minimumStockLevel status"
        )
        .sort({
          updatedAt: -1,
        });

    res.status(200).json({
      success: true,
      data: {
        location,
        stock,
      },
    });
  } catch (error) {
    console.error(
      "Get location stock error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid stock location ID",
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch location stock",
    });
  }
};


// GET /api/stock-locations/transfers
const getTransfers = async (req, res) => {
  try {
    const transfers =
      await StockTransfer.find()
        .populate(
          "product",
          "name sku unit"
        )
        .populate(
          "fromLocation",
          "name code type"
        )
        .populate(
          "toLocation",
          "name code type"
        )
        .populate(
          "processedBy",
          "name email role"
        )
        .sort({
          createdAt: -1,
        });

    res.status(200).json({
      success: true,
      count:
        transfers.length,
      data:
        transfers,
    });
  } catch (error) {
    console.error(
      "Get stock transfers error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch stock transfers",
    });
  }
};


// POST /api/stock-locations/transfers
const createTransfer = async (
  req,
  res
) => {
  try {
    const {
      product,
      fromLocation,
      toLocation,
      quantity,
      transferDate,
      notes,
    } = req.body;

    if (
      !product ||
      !fromLocation ||
      !toLocation
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Product, from location and to location are required",
      });
    }

    if (
      fromLocation ===
      toLocation
    ) {
      return res.status(400).json({
        success: false,
        message:
          "From and to locations must be different",
      });
    }

    const amount =
      Number(quantity);

    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Transfer quantity must be a positive whole number",
      });
    }

    const [
      productRecord,
      fromRecord,
      toRecord,
    ] = await Promise.all([
      Product.findById(product),
      StockLocation.findById(
        fromLocation
      ),
      StockLocation.findById(
        toLocation
      ),
    ]);

    if (!productRecord) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found",
      });
    }

    if (
      !fromRecord ||
      !toRecord
    ) {
      return res.status(404).json({
        success: false,
        message:
          "One of the selected stock locations was not found",
      });
    }

    if (
      fromRecord.status !==
        "active" ||
      toRecord.status !==
        "active"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Transfers require active stock locations",
      });
    }

    await ensureProductAllocated(
      productRecord
    );

    await decreaseSingleLocation(
      productRecord._id,
      fromRecord._id,
      amount
    );

    try {
      await addToLocation(
        productRecord._id,
        toRecord._id,
        amount
      );
    } catch (error) {
      await addToLocation(
        productRecord._id,
        fromRecord._id,
        amount
      );

      throw error;
    }

    let transfer;

    try {
      transfer =
        await StockTransfer.create({
          transferNumber:
            generateTransferNumber(),

          product:
            productRecord._id,

          productName:
            productRecord.name,

          sku:
            productRecord.sku,

          fromLocation:
            fromRecord._id,

          toLocation:
            toRecord._id,

          quantity:
            amount,

          transferDate:
            transferDate ||
            new Date(),

          notes:
            notes?.trim() ||
            "",

          processedBy:
            req.user?._id ||
            null,

          status:
            "completed",
        });
    } catch (error) {
      await decreaseSingleLocation(
        productRecord._id,
        toRecord._id,
        amount
      );

      await addToLocation(
        productRecord._id,
        fromRecord._id,
        amount
      );

      throw error;
    }

    const populated =
      await StockTransfer.findById(
        transfer._id
      )
        .populate(
          "product",
          "name sku unit"
        )
        .populate(
          "fromLocation",
          "name code type"
        )
        .populate(
          "toLocation",
          "name code type"
        )
        .populate(
          "processedBy",
          "name role"
        );

    res.status(201).json({
      success: true,
      message:
        "Stock transferred successfully",
      data:
        populated,
    });
  } catch (error) {
    console.error(
      "Create stock transfer error:",
      error
    );

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product or location ID",
      });
    }

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to transfer stock",
    });
  }
};


// POST /api/stock-locations/sync-existing
const syncExistingStock = async (
  req,
  res
) => {
  try {
    await ensureSystemLocations();

    const products =
      await Product.find();

    let syncedProducts = 0;

    for (const product of products) {
      const before =
        await getProductLocationTotal(
          product._id
        );

      await reconcileProductLocations(
        product._id,
        product.quantity
      );

      const after =
        await getProductLocationTotal(
          product._id
        );

      if (before !== after) {
        syncedProducts += 1;
      }
    }

    res.status(200).json({
      success: true,
      message:
        "Existing stock synchronized with stock locations",
      data: {
        totalProducts:
          products.length,
        synchronizedProducts:
          syncedProducts,
      },
    });
  } catch (error) {
    console.error(
      "Sync existing stock error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to synchronize existing stock",
    });
  }
};


module.exports = {
  getLocations,
  createLocation,
  updateLocation,
  getLocationStock,
  getTransfers,
  createTransfer,
  syncExistingStock,
};
