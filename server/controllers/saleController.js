const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

const {
  ensureProductAllocated,
  deductItemsFromLocations,
  rollbackDeductions,
} = require("../services/locationStockService");

const generateSaleNumber = () => {
  return `SAL-${Date.now()}`;
};


// GET /api/sales
const getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate(
        "items.product",
        "name sku unit"
      )
      .populate(
        "customer",
        "name phone email"
      )
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales,
    });
  } catch (error) {
    console.error("Get sales error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch sales",
    });
  }
};


// GET /api/sales/:id
const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(
      req.params.id
    )
      .populate(
        "items.product",
        "name sku unit category"
      )
      .populate(
        "customer",
        "name phone email address city"
      );

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    res.status(200).json({
      success: true,
      data: sale,
    });
  } catch (error) {
    console.error("Get sale error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid sale ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch sale",
    });
  }
};


// POST /api/sales
const createSale = async (req, res) => {
  try {
    const {
      customer,
      items,
      discount,
      paymentMethod,
      saleDate,
      notes,
    } = req.body;


    // =========================
    // VALIDATE ITEMS
    // =========================

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


    // =========================
    // RESOLVE CUSTOMER
    // =========================

    let customerId = null;

    let resolvedCustomerName =
      "Walk-in Customer";

    if (customer) {
      const selectedCustomer =
        await Customer.findById(customer);

      if (!selectedCustomer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      if (
        selectedCustomer.status !== "active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Selected customer is inactive",
        });
      }

      customerId =
        selectedCustomer._id;

      resolvedCustomerName =
        selectedCustomer.name;
    }


    // =========================
    // BUILD SALE ITEMS
    // =========================

    const saleItems = [];

    const usedProducts =
      new Set();

    let subtotalAmount = 0;


    for (const item of items) {

      if (!item.product) {
        return res.status(400).json({
          success: false,
          message:
            "Each sale item must contain a product",
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


      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product quantity must be a positive whole number",
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
        product.status !== "active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${product.name} is inactive`,
        });
      }


      // Keep location allocation synchronized
      // with consolidated product quantity.
      await ensureProductAllocated(
        product
      );


      if (
        quantity >
        product.quantity
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Insufficient stock for ${product.name}. Only ${product.quantity} ${product.unit} available.`,
        });
      }

      const sellingPrice =
        Number(
          product.sellingPrice
        );

      const purchasePrice =
        Number(
          product.purchasePrice
        ) || 0;

      const subtotal =
        quantity *
        sellingPrice;


      subtotalAmount +=
        subtotal;


      saleItems.push({
        product:
          product._id,

        productName:
          product.name,

        sku:
          product.sku,

        quantity,

        sellingPrice,

        purchasePrice,

        subtotal,
      });

    }
      // =========================
      // DISCOUNT
      // =========================

      const discountAmount =
        Number(discount) || 0;


      if (
        !Number.isFinite(
          discountAmount
        ) ||
        discountAmount < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Discount must be a valid non-negative number",
        });
      }


      if (
        discountAmount >
        subtotalAmount
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Discount cannot be greater than subtotal",
        });
      }


      const totalAmount =
        subtotalAmount -
        discountAmount;


      // =========================
      // CREATE SALE
      // =========================

      const sale =
        await Sale.create({

          saleNumber:
            generateSaleNumber(),

          customer:
            customerId,

          customerName:
            resolvedCustomerName,

          items:
            saleItems,

          subtotalAmount,

          discount:
            discountAmount,

          totalAmount,

          paymentMethod:
            paymentMethod ||
            "cash",

          saleDate:
            saleDate ||
            new Date(),

          notes:
            notes?.trim() ||
            "",

          status:
            "completed",
        });


      // =========================
      // UPDATE STOCK
      // =========================

      try {

        const stockOperations =
          saleItems.map(
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


        const result =
          await Product.bulkWrite(
            stockOperations
          );


        if (
          result.modifiedCount !==
          saleItems.length
        ) {

          await Sale.findByIdAndDelete(
            sale._id
          );

          return res.status(400).json({
            success: false,
            message:
              "Stock changed before sale could be completed. Please try again.",
          });
        }


        // Deduct the same sold quantity from
        // physical stock locations.
        try {
          await deductItemsFromLocations(
            saleItems
          );
        } catch (locationError) {

          // Product quantity was already reduced,
          // so restore it before failing the sale.
          const restoreOperations =
            saleItems.map(
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
            restoreOperations
          );

          await Sale.findByIdAndDelete(
            sale._id
          );

          throw locationError;
        }

      } catch (stockError) {

        await Sale.findByIdAndDelete(
          sale._id
        );

        throw stockError;
      }


      // =========================
      // POPULATE RESPONSE
      // =========================

      const populatedSale =
        await Sale.findById(
          sale._id
        )
          .populate(
            "items.product",
            "name sku unit"
          )
          .populate(
            "customer",
            "name phone email"
          );


      res.status(201).json({
        success: true,
        message:
          "Sale completed and stock updated successfully",
        data:
          populatedSale,
      });

    } catch (error) {

      console.error(
        "Create sale error:",
        error
      );


      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product or customer ID",
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


      if (
        error.code ===
        11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Duplicate sale number. Please try again.",
        });
      }


      res.status(500).json({
        success: false,
        message:
          "Failed to create sale",
      });
    }
  };


  module.exports = {
    getSales,
    getSaleById,
    createSale,
  };