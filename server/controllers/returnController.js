const Return = require("../models/Return");
const Sale = require("../models/Sale");
const Product = require("../models/Product");


const generateReturnNumber = () => {
  return `RET-${Date.now()}`;
};


// GET ALL RETURNS
const getReturns = async (req, res) => {
  try {
    const returns = await Return.find()
      .populate(
        "sale",
        "saleNumber saleDate"
      )
      .populate(
        "customer",
        "name phone email"
      )
      .populate(
        "items.product",
        "name sku unit"
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
      count: returns.length,
      data: returns,
    });

  } catch (error) {
    console.error(
      "Get returns error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch returns",
    });
  }
};


// GET SINGLE RETURN
const getReturnById = async (req, res) => {
  try {
    const returnRecord =
      await Return.findById(
        req.params.id
      )
        .populate(
          "sale",
          "saleNumber saleDate totalAmount"
        )
        .populate(
          "customer",
          "name phone email"
        )
        .populate(
          "items.product",
          "name sku unit"
        )
        .populate(
          "processedBy",
          "name email role"
        );


    if (!returnRecord) {
      return res.status(404).json({
        success: false,
        message: "Return not found",
      });
    }


    res.status(200).json({
      success: true,
      data: returnRecord,
    });

  } catch (error) {
    console.error(
      "Get return error:",
      error
    );


    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid return ID",
      });
    }


    res.status(500).json({
      success: false,
      message:
        "Failed to fetch return",
    });
  }
};


// GET RETURNABLE SALE DETAILS
const getReturnableSale =
  async (req, res) => {
    try {
      const sale =
        await Sale.findById(
          req.params.saleId
        )
          .populate(
            "items.product",
            "name sku unit"
          )
          .populate(
            "customer",
            "name phone email"
          );


      if (!sale) {
        return res.status(404).json({
          success: false,
          message:
            "Sale not found",
        });
      }


      if (
        sale.status !==
        "completed"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only completed sales can be returned",
        });
      }


      const previousReturns =
        await Return.find({
          sale: sale._id,
          status: "completed",
        });


      const alreadyReturned = {};


      for (
        const returnRecord
        of previousReturns
      ) {
        for (
          const item
          of returnRecord.items
        ) {
          const productId =
            item.product.toString();

          alreadyReturned[
            productId
          ] =
            (
              alreadyReturned[
                productId
              ] || 0
            ) +
            item.quantity;
        }
      }


      const returnableItems =
        sale.items.map(
          (item) => {
            const productId =
              item.product?._id
                ? item.product._id.toString()
                : item.product.toString();


            const returnedQuantity =
              alreadyReturned[
                productId
              ] || 0;


            const returnableQuantity =
              Math.max(
                0,
                item.quantity -
                  returnedQuantity
              );


            return {
              product:
                item.product,

              productName:
                item.productName,

              sku:
                item.sku,

              soldQuantity:
                item.quantity,

              returnedQuantity,

              returnableQuantity,

              sellingPrice:
                item.sellingPrice,
            };
          }
        );


      res.status(200).json({
        success: true,

        data: {
          sale: {
            _id:
              sale._id,

            saleNumber:
              sale.saleNumber,

            customer:
              sale.customer,

            customerName:
              sale.customerName,

            saleDate:
              sale.saleDate,

            totalAmount:
              sale.totalAmount,

            paymentMethod:
              sale.paymentMethod,
          },

          items:
            returnableItems,
        },
      });

    } catch (error) {
      console.error(
        "Get returnable sale error:",
        error
      );


      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid sale ID",
        });
      }


      res.status(500).json({
        success: false,
        message:
          "Failed to fetch returnable sale",
      });
    }
  };


// CREATE RETURN
const createReturn =
  async (req, res) => {
    try {
      const {
        sale,
        items,
        refundMethod,
        reason,
        returnDate,
      } = req.body;


      if (!sale) {
        return res.status(400).json({
          success: false,
          message:
            "Sale is required",
        });
      }


      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "At least one returned item is required",
        });
      }


      const selectedSale =
        await Sale.findById(
          sale
        );


      if (!selectedSale) {
        return res.status(404).json({
          success: false,
          message:
            "Sale not found",
        });
      }


      if (
        selectedSale.status !==
        "completed"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only completed sales can be returned",
        });
      }


      const previousReturns =
        await Return.find({
          sale:
            selectedSale._id,

          status:
            "completed",
        });


      const alreadyReturned = {};


      for (
        const returnRecord
        of previousReturns
      ) {
        for (
          const returnedItem
          of returnRecord.items
        ) {
          const productId =
            returnedItem.product.toString();


          alreadyReturned[
            productId
          ] =
            (
              alreadyReturned[
                productId
              ] || 0
            ) +
            returnedItem.quantity;
        }
      }


      const returnItems = [];

      const usedProducts =
        new Set();

      let totalRefund = 0;


      for (
        const item
        of items
      ) {

        if (!item.product) {
          return res.status(400).json({
            success: false,
            message:
              "Each returned item must contain a product",
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
              "The same product cannot be returned twice in one return",
          });
        }


        usedProducts.add(
          item.product
        );


        const quantity =
          Number(
            item.quantity
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
              "Return quantity must be a positive whole number",
          });
        }


        const saleItem =
          selectedSale.items.find(
            (saleItem) =>
              saleItem.product.toString() ===
              item.product
          );


        if (!saleItem) {
          return res.status(400).json({
            success: false,
            message:
              "Product was not part of this sale",
          });
        }


        const returnedBefore =
          alreadyReturned[
            item.product
          ] || 0;


        const availableToReturn =
          saleItem.quantity -
          returnedBefore;


        if (
          quantity >
          availableToReturn
        ) {
          return res.status(400).json({
            success: false,
            message:
              `Only ${availableToReturn} unit(s) of ${saleItem.productName} can still be returned`,
          });
        }


        const sellingPrice =
          Number(
            saleItem.sellingPrice
          );


        const refundSubtotal =
          sellingPrice *
          quantity;


        totalRefund +=
          refundSubtotal;


        returnItems.push({
          product:
            saleItem.product,

          productName:
            saleItem.productName,

          sku:
            saleItem.sku,

          quantity,

          sellingPrice,

          refundSubtotal,
        });
      }


      const returnRecord =
        await Return.create({
          returnNumber:
            generateReturnNumber(),

          sale:
            selectedSale._id,

          saleNumber:
            selectedSale.saleNumber,

          customer:
            selectedSale.customer ||
            null,

          customerName:
            selectedSale.customerName ||
            "Walk-in Customer",

          items:
            returnItems,

          totalRefund,

          refundMethod:
            refundMethod ||
            selectedSale.paymentMethod ||
            "cash",

          reason:
            reason?.trim() ||
            "",

          returnDate:
            returnDate ||
            new Date(),

          processedBy:
            req.user?._id ||
            null,

          status:
            "completed",
        });


      try {
        const stockOperations =
          returnItems.map(
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


        const stockResult =
          await Product.bulkWrite(
            stockOperations
          );


        if (
          stockResult.modifiedCount !==
          returnItems.length
        ) {
          await Return.findByIdAndDelete(
            returnRecord._id
          );


          return res.status(400).json({
            success: false,
            message:
              "Unable to restore all returned stock. Please try again.",
          });
        }

      } catch (stockError) {

        await Return.findByIdAndDelete(
          returnRecord._id
        );

        throw stockError;
      }


      const populatedReturn =
        await Return.findById(
          returnRecord._id
        )
          .populate(
            "sale",
            "saleNumber saleDate"
          )
          .populate(
            "customer",
            "name phone email"
          )
          .populate(
            "items.product",
            "name sku unit"
          )
          .populate(
            "processedBy",
            "name email role"
          );


      res.status(201).json({
        success: true,
        message:
          "Return completed and stock restored successfully",
        data:
          populatedReturn,
      });

    } catch (error) {

      console.error(
        "Create return error:",
        error
      );


      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid sale or product ID",
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


      res.status(500).json({
        success: false,
        message:
          "Failed to process return",
      });
    }
  };


module.exports = {
  getReturns,
  getReturnById,
  getReturnableSale,
  createReturn,
};