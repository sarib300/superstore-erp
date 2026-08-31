const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const Purchase = require("../models/Purchase");
const Sale = require("../models/Sale");


// GET /api/dashboard
const getDashboardSummary = async (req, res) => {
  try {
    // Basic counts
    const totalProducts = await Product.countDocuments();

    const totalSuppliers = await Supplier.countDocuments({
      status: "active",
    });

    const lowStockProducts = await Product.find({
      status: "active",
      $expr: {
        $lte: [
          "$quantity",
          "$minimumStockLevel",
        ],
      },
    })
      .select(
        "name sku quantity minimumStockLevel unit"
      )
      .sort({
        quantity: 1,
      });


    // Total purchase value
    const purchaseTotals =
      await Purchase.aggregate([
        {
          $match: {
            status: "received",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$totalAmount",
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const totalPurchaseValue =
      purchaseTotals.length > 0
        ? purchaseTotals[0].total
        : 0;

    const totalPurchases =
      purchaseTotals.length > 0
        ? purchaseTotals[0].count
        : 0;


    // Total sales value
    const saleTotals =
      await Sale.aggregate([
        {
          $match: {
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            revenue: {
              $sum: "$totalAmount",
            },
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const totalSalesRevenue =
      saleTotals.length > 0
        ? saleTotals[0].revenue
        : 0;

    const totalSales =
      saleTotals.length > 0
        ? saleTotals[0].count
        : 0;


    // Recent purchases
    const recentPurchases =
      await Purchase.find({
        status: "received",
      })
        .select(
          "purchaseNumber supplierName totalAmount purchaseDate status"
        )
        .sort({
          purchaseDate: -1,
          createdAt: -1,
        })
        .limit(5);


    // Recent sales
    const recentSales =
      await Sale.find({
        status: "completed",
      })
        .select(
          "saleNumber customerName totalAmount paymentMethod saleDate status"
        )
        .sort({
          saleDate: -1,
          createdAt: -1,
        })
        .limit(5);


    // Top selling products
    const topSellingProducts =
      await Sale.aggregate([
        {
          $match: {
            status: "completed",
          },
        },

        {
          $unwind: "$items",
        },

        {
          $group: {
            _id: "$items.product",
            productName: {
              $first:
                "$items.productName",
            },
            sku: {
              $first: "$items.sku",
            },
            quantitySold: {
              $sum:
                "$items.quantity",
            },
            salesAmount: {
              $sum:
                "$items.subtotal",
            },
          },
        },

        {
          $sort: {
            quantitySold: -1,
          },
        },

        {
          $limit: 5,
        },
      ]);


    res.status(200).json({
      success: true,

      data: {
        totalProducts,
        totalSuppliers,

        lowStockCount:
          lowStockProducts.length,

        lowStockProducts,

        totalPurchaseValue,
        totalPurchases,

        totalSalesRevenue,
        totalSales,

        recentPurchases,
        recentSales,

        topSellingProducts,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard summary error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load dashboard data",
    });
  }
};


module.exports = {
  getDashboardSummary,
};