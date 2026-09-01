const Sale = require("../models/Sale");
const Return = require("../models/Return");
const Purchase = require("../models/Purchase");
const Expense = require("../models/Expense");


const getReports = async (req, res) => {
  try {
    // =========================
    // DATE FILTER
    // =========================

    const {
      startDate,
      endDate,
    } = req.query;


    const saleDateFilter = {};
    const returnDateFilter = {};
    const purchaseDateFilter = {};
    const expenseDateFilter = {};


    if (startDate) {
      const start =
        new Date(startDate);

      start.setHours(
        0,
        0,
        0,
        0
      );

      saleDateFilter.$gte = start;
      returnDateFilter.$gte = start;
      purchaseDateFilter.$gte = start;
      expenseDateFilter.$gte = start;
    }


    if (endDate) {
      const end =
        new Date(endDate);

      end.setHours(
        23,
        59,
        59,
        999
      );

      saleDateFilter.$lte = end;
      returnDateFilter.$lte = end;
      purchaseDateFilter.$lte = end;
      expenseDateFilter.$lte = end;
    }


    // =========================
    // SALES
    // =========================

    const saleQuery = {
      status: "completed",
    };


    if (
      Object.keys(
        saleDateFilter
      ).length > 0
    ) {
      saleQuery.saleDate =
        saleDateFilter;
    }


    const sales =
      await Sale.find(
        saleQuery
      ).lean();


    // =========================
    // RETURNS
    // =========================

    const returnQuery = {
      status: "completed",
    };


    if (
      Object.keys(
        returnDateFilter
      ).length > 0
    ) {
      returnQuery.returnDate =
        returnDateFilter;
    }


    const returns =
      await Return.find(
        returnQuery
      ).lean();


    // =========================
    // PURCHASES
    // =========================

    const purchaseQuery = {
      status: "received",
    };


    if (
      Object.keys(
        purchaseDateFilter
      ).length > 0
    ) {
      purchaseQuery.purchaseDate =
        purchaseDateFilter;
    }


    const purchases =
      await Purchase.find(
        purchaseQuery
      ).lean();


    // =========================
    // EXPENSES
    // =========================

    const expenseQuery = {
      status: "active",
    };


    if (
      Object.keys(
        expenseDateFilter
      ).length > 0
    ) {
      expenseQuery.expenseDate =
        expenseDateFilter;
    }


    const expenses =
      await Expense.find(
        expenseQuery
      ).lean();


    // =========================
    // SALES TOTALS
    // =========================

    let grossSales = 0;

    let grossCOGS = 0;

    let costedSaleItems = 0;

    let uncostedSaleItems = 0;

    let totalUnitsSold = 0;


    const paymentMethods = {};

    const productStats = {};


    for (const sale of sales) {

      grossSales +=
        Number(
          sale.totalAmount ||
            0
        );


      const method =
        sale.paymentMethod ||
        "other";


      if (
        !paymentMethods[
          method
        ]
      ) {
        paymentMethods[
          method
        ] = {
          method,
          salesCount: 0,
          amount: 0,
        };
      }


      paymentMethods[
        method
      ].salesCount += 1;


      paymentMethods[
        method
      ].amount +=
        Number(
          sale.totalAmount ||
            0
        );


      for (
        const item
        of sale.items || []
      ) {

        const quantity =
          Number(
            item.quantity ||
              0
          );

        const sellingPrice =
          Number(
            item.sellingPrice ||
              0
          );


        totalUnitsSold +=
          quantity;


        // Cost snapshot exists
        if (
          item.purchasePrice !==
            undefined &&
          item.purchasePrice !==
            null
        ) {
          const purchasePrice =
            Number(
              item.purchasePrice ||
                0
            );


          grossCOGS +=
            purchasePrice *
            quantity;


          costedSaleItems += 1;

        } else {

          uncostedSaleItems +=
            1;
        }


        const productId =
          item.product
            ?.toString() ||
          item.sku ||
          item.productName;


        if (
          !productStats[
            productId
          ]
        ) {
          productStats[
            productId
          ] = {
            productId,

            productName:
              item.productName,

            sku:
              item.sku,

            quantitySold: 0,

            salesAmount: 0,

            returnedQuantity: 0,

            refundAmount: 0,
          };
        }


        productStats[
          productId
        ].quantitySold +=
          quantity;


        productStats[
          productId
        ].salesAmount +=
          quantity *
          sellingPrice;
      }
    }


    // =========================
    // RETURNS
    // =========================

    let totalRefunds = 0;

    let returnedUnits = 0;

    let returnedCOGS = 0;


    // Map sales for finding
    // original purchasePrice
    const saleMap =
      new Map();


    for (
      const sale
      of sales
    ) {
      saleMap.set(
        sale._id.toString(),
        sale
      );
    }


    for (
      const returnRecord
      of returns
    ) {

      totalRefunds +=
        Number(
          returnRecord.totalRefund ||
            0
        );


      const originalSale =
        saleMap.get(
          returnRecord.sale
            ?.toString()
        );


      for (
        const returnedItem
        of returnRecord.items ||
        []
      ) {

        const quantity =
          Number(
            returnedItem.quantity ||
              0
          );


        returnedUnits +=
          quantity;


        const productId =
          returnedItem.product
            ?.toString() ||
          returnedItem.sku ||
          returnedItem.productName;


        if (
          productStats[
            productId
          ]
        ) {
          productStats[
            productId
          ].returnedQuantity +=
            quantity;


          productStats[
            productId
          ].refundAmount +=
            Number(
              returnedItem.refundSubtotal ||
                0
            );
        }


        // Reverse COGS using
        // original sale cost snapshot
        if (originalSale) {

          const originalItem =
            originalSale.items?.find(
              (item) =>
                item.product
                  ?.toString() ===
                returnedItem.product
                  ?.toString()
            );


          if (
            originalItem &&
            originalItem.purchasePrice !==
              undefined &&
            originalItem.purchasePrice !==
              null
          ) {
            returnedCOGS +=
              Number(
                originalItem.purchasePrice ||
                  0
              ) *
              quantity;
          }
        }
      }
    }


    // =========================
    // NET SALES + COGS
    // =========================

    const netSales =
      grossSales -
      totalRefunds;


    const netCOGS =
      Math.max(
        0,
        grossCOGS -
          returnedCOGS
      );


    const grossProfit =
      netSales -
      netCOGS;


    // =========================
    // PURCHASE SPEND
    // =========================

    const purchaseSpend =
      purchases.reduce(
        (
          total,
          purchase
        ) =>
          total +
          Number(
            purchase.totalAmount ||
              0
          ),
        0
      );


    // =========================
    // OPERATING EXPENSES
    // =========================

    const operatingExpenses =
      expenses.reduce(
        (
          total,
          expense
        ) =>
          total +
          Number(
            expense.amount ||
              0
          ),
        0
      );


    // =========================
    // NET PROFIT
    // =========================

    const netProfit =
      grossProfit -
      operatingExpenses;


    // =========================
    // MARGINS
    // =========================

    const grossMargin =
      netSales > 0
        ? (
            grossProfit /
            netSales
          ) * 100
        : 0;


    const netMargin =
      netSales > 0
        ? (
            netProfit /
            netSales
          ) * 100
        : 0;


    // =========================
    // TOP PRODUCTS
    // =========================

    const topProducts =
      Object.values(
        productStats
      )
        .map(
          (product) => ({
            ...product,

            netQuantitySold:
              Math.max(
                0,
                product.quantitySold -
                  product.returnedQuantity
              ),

            netSalesAmount:
              product.salesAmount -
              product.refundAmount,
          })
        )
        .sort(
          (a, b) =>
            b.netSalesAmount -
            a.netSalesAmount
        )
        .slice(
          0,
          10
        );


    // =========================
    // EXPENSE BREAKDOWN
    // =========================

    const expenseCategories = {};


    for (
      const expense
      of expenses
    ) {

      const category =
        expense.category ||
        "other";


      if (
        !expenseCategories[
          category
        ]
      ) {
        expenseCategories[
          category
        ] = {
          category,
          count: 0,
          amount: 0,
        };
      }


      expenseCategories[
        category
      ].count += 1;


      expenseCategories[
        category
      ].amount +=
        Number(
          expense.amount ||
            0
        );
    }


    // =========================
    // MONTHLY SALES TREND
    // =========================

    const monthlyTrend = {};


    for (
      const sale
      of sales
    ) {

      const date =
        new Date(
          sale.saleDate
        );


      const key =
        `${date.getFullYear()}-${String(
          date.getMonth() +
            1
        ).padStart(
          2,
          "0"
        )}`;


      if (
        !monthlyTrend[key]
      ) {
        monthlyTrend[key] = {
          month: key,
          sales: 0,
          transactions: 0,
          refunds: 0,
          expenses: 0,
        };
      }


      monthlyTrend[
        key
      ].sales +=
        Number(
          sale.totalAmount ||
            0
        );


      monthlyTrend[
        key
      ].transactions +=
        1;
    }


    for (
      const returnRecord
      of returns
    ) {

      const date =
        new Date(
          returnRecord.returnDate
        );


      const key =
        `${date.getFullYear()}-${String(
          date.getMonth() +
            1
        ).padStart(
          2,
          "0"
        )}`;


      if (
        !monthlyTrend[key]
      ) {
        monthlyTrend[key] = {
          month: key,
          sales: 0,
          transactions: 0,
          refunds: 0,
          expenses: 0,
        };
      }


      monthlyTrend[
        key
      ].refunds +=
        Number(
          returnRecord.totalRefund ||
            0
        );
    }


    for (
      const expense
      of expenses
    ) {

      const date =
        new Date(
          expense.expenseDate
        );


      const key =
        `${date.getFullYear()}-${String(
          date.getMonth() +
            1
        ).padStart(
          2,
          "0"
        )}`;


      if (
        !monthlyTrend[key]
      ) {
        monthlyTrend[key] = {
          month: key,
          sales: 0,
          transactions: 0,
          refunds: 0,
          expenses: 0,
        };
      }


      monthlyTrend[
        key
      ].expenses +=
        Number(
          expense.amount ||
            0
        );
    }


    const trend =
      Object.values(
        monthlyTrend
      )
        .sort(
          (a, b) =>
            a.month.localeCompare(
              b.month
            )
        )
        .map(
          (month) => ({
            ...month,

            netSales:
              month.sales -
              month.refunds,
          })
        );

    // =========================
    // COST DATA COVERAGE
    // =========================

    const totalSaleItems =
      costedSaleItems +
      uncostedSaleItems;


    const costCoveragePercent =
      totalSaleItems > 0
        ? (
            costedSaleItems /
            totalSaleItems
          ) * 100
        : 100;


    const profitDataComplete =
      uncostedSaleItems === 0;


    // =========================
    // RESPONSE
    // =========================

    res.status(200).json({
      success: true,

      data: {
        period: {
          startDate:
            startDate || null,

          endDate:
            endDate || null,
        },


        summary: {
          grossSales,

          totalRefunds,

          netSales,

          grossCOGS,

          returnedCOGS,

          netCOGS,

          grossProfit:
            profitDataComplete
              ? grossProfit
              : null,

          operatingExpenses,

          netProfit:
            profitDataComplete
              ? netProfit
              : null,

          purchaseSpend,

          grossMargin:
            profitDataComplete
              ? Number(
                  grossMargin.toFixed(2)
                )
              : null,

          netMargin:
            profitDataComplete
              ? Number(
                  netMargin.toFixed(2)
                )
              : null,
        },


        activity: {
          totalSales:
            sales.length,

          totalUnitsSold,

          totalReturns:
            returns.length,

          returnedUnits,

          totalPurchases:
            purchases.length,

          totalExpenses:
            expenses.length,
        },


        costData: {
          costedSaleItems,

          uncostedSaleItems,

          coveragePercent:
            Number(
              costCoveragePercent.toFixed(2)
            ),

          isComplete:
            uncostedSaleItems === 0,
        },


        topProducts,


        paymentMethods:
          Object.values(
            paymentMethods
          ).sort(
            (a, b) =>
              b.amount -
              a.amount
          ),


        expenseCategories:
          Object.values(
            expenseCategories
          ).sort(
            (a, b) =>
              b.amount -
              a.amount
          ),


        monthlyTrend:
          trend,
      },
    });

  } catch (error) {
    console.error(
      "Reports error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to generate reports",
    });
  }
};


module.exports = {
  getReports,
};