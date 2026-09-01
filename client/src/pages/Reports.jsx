import { useEffect, useState } from "react";

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  WalletCards,
  ShoppingCart,
  RotateCcw,
  ReceiptText,
  Package,
  CreditCard,
  AlertTriangle,
  CalendarDays,
  RefreshCcw,
} from "lucide-react";

import {
  getReports,
} from "../services/reportService";


function Reports() {
  const [report, setReport] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");


  // =========================
  // LOAD REPORTS
  // =========================

  const loadReports = async (
    start = startDate,
    end = endDate
  ) => {
    try {
      setLoading(true);
      setError("");

      const result =
        await getReports(
          start,
          end
        );

      setReport(
        result.data
      );

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load reports."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadReports("", "");
  }, []);


  // =========================
  // APPLY FILTER
  // =========================

  const handleFilter = (
    event
  ) => {
    event.preventDefault();

    if (
      startDate &&
      endDate &&
      startDate > endDate
    ) {
      setError(
        "Start date cannot be after end date."
      );

      return;
    }

    loadReports(
      startDate,
      endDate
    );
  };


  // =========================
  // RESET FILTER
  // =========================

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setError("");

    loadReports(
      "",
      ""
    );
  };


  // =========================
  // HELPERS
  // =========================

  const money = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "N/A";
    }

    return `Rs. ${Number(
      value
    ).toLocaleString()}`;
  };


  const percent = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "N/A";
    }

    return `${Number(
      value
    ).toFixed(2)}%`;
  };


  const formatMonth = (
    month
  ) => {
    if (!month) {
      return "-";
    }

    const [
      year,
      monthNumber,
    ] = month.split("-");

    const date =
      new Date(
        Number(year),
        Number(monthNumber) -
          1,
        1
      );

    return date.toLocaleDateString(
      undefined,
      {
        month: "short",
        year: "numeric",
      }
    );
  };


  if (loading) {
    return (
      <div className="products-state">
        <p>
          Loading reports...
        </p>
      </div>
    );
  }


  if (
    !report &&
    error
  ) {
    return (
      <div className="products-state error-state">

        <p>
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            loadReports()
          }
        >
          Try Again
        </button>

      </div>
    );
  }


  const summary =
    report?.summary || {};

  const activity =
    report?.activity || {};

  const costData =
    report?.costData || {};

  const topProducts =
    report?.topProducts || [];

  const paymentMethods =
    report?.paymentMethods || [];

  const expenseCategories =
    report?.expenseCategories ||
    [];

  const monthlyTrend =
    report?.monthlyTrend || [];


  return (
    <div className="reports-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="page-header">

        <div>

          <h1>
            <BarChart3
              size={28}
            />

            Reports & Analytics
          </h1>

          <p>
            Monitor financial performance,
            sales activity and business
            trends.
          </p>

        </div>

      </div>


      {/* =========================
          DATE FILTER
      ========================= */}

      <form
        className="report-filter-bar"
        onSubmit={
          handleFilter
        }
      >

        <div className="report-date-field">

          <label>
            Start Date
          </label>

          <input
            type="date"
            value={
              startDate
            }
            onChange={
              (event) =>
                setStartDate(
                  event.target
                    .value
                )
            }
          />

        </div>


        <div className="report-date-field">

          <label>
            End Date
          </label>

          <input
            type="date"
            value={
              endDate
            }
            onChange={
              (event) =>
                setEndDate(
                  event.target
                    .value
                )
            }
          />

        </div>


        <button
          type="submit"
          className="primary-btn"
        >
          <CalendarDays
            size={17}
          />
          Apply Filter
        </button>


        <button
          type="button"
          className="secondary-btn"
          onClick={
            handleReset
          }
        >
          <RefreshCcw
            size={16}
          />
          Reset
        </button>

      </form>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {/* =========================
          COST DATA WARNING
      ========================= */}

      {!costData.isComplete && (

        <div className="report-warning">

          <AlertTriangle
            size={22}
          />

          <div>

            <strong>
              Profit data is incomplete
            </strong>

            <p>
              Only{" "}
              {costData.coveragePercent}%
              of sale items contain
              historical cost data.
              Gross profit and net profit
              are hidden until cost
              coverage reaches 100%.
            </p>

          </div>

        </div>

      )}


      {/* =========================
          FINANCIAL SUMMARY
      ========================= */}

      <div className="report-section-header">

        <div>
          <h2>
            Financial Overview
          </h2>

          <p>
            Core revenue, refund and cost
            metrics.
          </p>
        </div>

      </div>


      <div className="report-summary-grid">

        <div className="report-card">

          <div className="report-card-icon">
            <TrendingUp
              size={20}
            />
          </div>

          <div>

            <span>
              Gross Sales
            </span>

            <strong>
              {money(
                summary.grossSales
              )}
            </strong>

          </div>

        </div>


        <div className="report-card">

          <div className="report-card-icon">
            <RotateCcw
              size={20}
            />
          </div>

          <div>

            <span>
              Refunds
            </span>

            <strong>
              {money(
                summary.totalRefunds
              )}
            </strong>

          </div>

        </div>


        <div className="report-card">

          <div className="report-card-icon">
            <ReceiptText
              size={20}
            />
          </div>

          <div>

            <span>
              Net Sales
            </span>

            <strong>
              {money(
                summary.netSales
              )}
            </strong>

          </div>

        </div>


        <div className="report-card">

          <div className="report-card-icon">
            <Package
              size={20}
            />
          </div>

          <div>

            <span>
              Known COGS
            </span>

            <strong>
              {money(
                summary.netCOGS
              )}
            </strong>

          </div>

        </div>


        <div className="report-card">

          <div className="report-card-icon">
            <ShoppingCart
              size={20}
            />
          </div>

          <div>

            <span>
              Purchase Spend
            </span>

            <strong>
              {money(
                summary.purchaseSpend
              )}
            </strong>

          </div>

        </div>


        <div className="report-card">

          <div className="report-card-icon">
            <WalletCards
              size={20}
            />
          </div>

          <div>

            <span>
              Operating Expenses
            </span>

            <strong>
              {money(
                summary.operatingExpenses
              )}
            </strong>

          </div>

        </div>


        <div
          className={`report-card ${
            summary.grossProfit ===
            null
              ? "report-card-disabled"
              : ""
          }`}
        >

          <div className="report-card-icon">
            <TrendingUp
              size={20}
            />
          </div>

          <div>

            <span>
              Gross Profit
            </span>

            <strong>
              {money(
                summary.grossProfit
              )}
            </strong>

            <small>
              Margin:{" "}
              {percent(
                summary.grossMargin
              )}
            </small>

          </div>

        </div>


        <div
          className={`report-card ${
            summary.netProfit ===
            null
              ? "report-card-disabled"
              : summary.netProfit >=
                0
              ? "report-profit-card"
              : "report-loss-card"
          }`}
        >

          <div className="report-card-icon">

            {summary.netProfit !==
              null &&
            summary.netProfit <
              0 ? (
              <TrendingDown
                size={20}
              />
            ) : (
              <TrendingUp
                size={20}
              />
            )}

          </div>

          <div>

            <span>
              Net Profit
            </span>

            <strong>
              {money(
                summary.netProfit
              )}
            </strong>

            <small>
              Margin:{" "}
              {percent(
                summary.netMargin
              )}
            </small>

          </div>

        </div>

      </div>


      {/* =========================
          ACTIVITY SUMMARY
      ========================= */}

      <div className="report-section-header">

        <div>
          <h2>
            Business Activity
          </h2>

          <p>
            Transaction and volume summary.
          </p>
        </div>

      </div>


      <div className="report-activity-grid">

        <div className="summary-card">
          <span>
            Sales
          </span>

          <strong>
            {
              activity.totalSales ||
              0
            }
          </strong>
        </div>


        <div className="summary-card">
          <span>
            Units Sold
          </span>

          <strong>
            {
              activity.totalUnitsSold ||
              0
            }
          </strong>
        </div>


        <div className="summary-card">
          <span>
            Returns
          </span>

          <strong>
            {
              activity.totalReturns ||
              0
            }
          </strong>
        </div>


        <div className="summary-card">
          <span>
            Returned Units
          </span>

          <strong>
            {
              activity.returnedUnits ||
              0
            }
          </strong>
        </div>


        <div className="summary-card">
          <span>
            Purchases
          </span>

          <strong>
            {
              activity.totalPurchases ||
              0
            }
          </strong>
        </div>


        <div className="summary-card">
          <span>
            Expenses
          </span>

          <strong>
            {
              activity.totalExpenses ||
              0
            }
          </strong>
        </div>

      </div>


      {/* =========================
          TOP PRODUCTS
      ========================= */}

      <div className="report-grid-two">

        <div className="report-panel">

          <div className="report-panel-header">

            <div>
              <h3>
                Top Products
              </h3>

              <p>
                Ranked by net sales value
              </p>
            </div>

          </div>


          {topProducts.length ===
          0 ? (

            <div className="report-empty">
              No sales data available.
            </div>

          ) : (

            <div className="table-responsive">

              <table className="erp-table">

                <thead>

                  <tr>
                    <th>
                      Product
                    </th>

                    <th>
                      Net Qty
                    </th>

                    <th>
                      Returns
                    </th>

                    <th>
                      Net Sales
                    </th>
                  </tr>

                </thead>


                <tbody>

                  {topProducts.map(
                    (product) => (

                      <tr
                        key={
                          product.productId
                        }
                      >

                        <td>

                          <strong>
                            {
                              product.productName
                            }
                          </strong>

                          <div className="report-subtext">
                            {
                              product.sku
                            }
                          </div>

                        </td>


                        <td>
                          {
                            product.netQuantitySold
                          }
                        </td>


                        <td>
                          {
                            product.returnedQuantity
                          }
                        </td>


                        <td>

                          <strong>
                            {money(
                              product.netSalesAmount
                            )}
                          </strong>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>


        {/* =========================
            PAYMENT METHODS
        ========================= */}

        <div className="report-panel">

          <div className="report-panel-header">

            <div>
              <h3>
                Payment Methods
              </h3>

              <p>
                Sales collected by payment
                type
              </p>
            </div>

          </div>


          {paymentMethods.length ===
          0 ? (

            <div className="report-empty">
              No payment data available.
            </div>

          ) : (

            <div className="report-breakdown-list">

              {paymentMethods.map(
                (method) => (

                  <div
                    className="report-breakdown-row"
                    key={
                      method.method
                    }
                  >

                    <div className="report-breakdown-label">

                      <CreditCard
                        size={17}
                      />

                      <div>

                        <strong className="capitalize">
                          {
                            method.method
                          }
                        </strong>

                        <span>
                          {
                            method.salesCount
                          }{" "}
                          transaction(s)
                        </span>

                      </div>

                    </div>


                    <strong>
                      {money(
                        method.amount
                      )}
                    </strong>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>


      {/* =========================
          EXPENSE CATEGORIES
      ========================= */}

      <div className="report-grid-two">

        <div className="report-panel">

          <div className="report-panel-header">

            <div>
              <h3>
                Expense Breakdown
              </h3>

              <p>
                Active operating expenses by
                category
              </p>
            </div>

          </div>


          {expenseCategories.length ===
          0 ? (

            <div className="report-empty">
              No expense data available.
            </div>

          ) : (

            <div className="report-breakdown-list">

              {expenseCategories.map(
                (category) => (

                  <div
                    className="report-breakdown-row"
                    key={
                      category.category
                    }
                  >

                    <div>

                      <strong className="capitalize">
                        {
                          category.category
                        }
                      </strong>

                      <span>
                        {
                          category.count
                        }{" "}
                        expense(s)
                      </span>

                    </div>


                    <strong>
                      {money(
                        category.amount
                      )}
                    </strong>

                  </div>

                )
              )}

            </div>

          )}

        </div>


        {/* =========================
            COST COVERAGE
        ========================= */}

        <div className="report-panel">

          <div className="report-panel-header">

            <div>
              <h3>
                Cost Data Coverage
              </h3>

              <p>
                Historical cost information
                available for sales
              </p>
            </div>

          </div>


          <div className="cost-coverage-block">

            <div className="cost-coverage-number">

              {Number(
                costData.coveragePercent ||
                  0
              ).toFixed(1)}
              %

            </div>


            <div className="cost-progress">

              <div
                className="cost-progress-fill"
                style={{
                  width: `${Math.min(
                    100,
                    Number(
                      costData.coveragePercent ||
                        0
                    )
                  )}%`,
                }}
              />

            </div>


            <div className="cost-coverage-details">

              <div>

                <span>
                  Costed Sale Items
                </span>

                <strong>
                  {
                    costData.costedSaleItems ||
                    0
                  }
                </strong>

              </div>


              <div>

                <span>
                  Missing Cost Data
                </span>

                <strong>
                  {
                    costData.uncostedSaleItems ||
                    0
                  }
                </strong>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =========================
          MONTHLY TREND
      ========================= */}

      <div className="report-panel">

        <div className="report-panel-header">

          <div>
            <h3>
              Monthly Performance
            </h3>

            <p>
              Sales, refunds and operating
              expenses over time
            </p>
          </div>

        </div>


        {monthlyTrend.length ===
        0 ? (

          <div className="report-empty">
            No monthly data available.
          </div>

        ) : (

          <div className="table-responsive">

            <table className="erp-table">

              <thead>

                <tr>
                  <th>
                    Month
                  </th>

                  <th>
                    Transactions
                  </th>

                  <th>
                    Gross Sales
                  </th>

                  <th>
                    Refunds
                  </th>

                  <th>
                    Net Sales
                  </th>

                  <th>
                    Expenses
                  </th>
                </tr>

              </thead>


              <tbody>

                {monthlyTrend.map(
                  (month) => (

                    <tr
                      key={
                        month.month
                      }
                    >

                      <td>

                        <strong>
                          {formatMonth(
                            month.month
                          )}
                        </strong>

                      </td>


                      <td>
                        {
                          month.transactions
                        }
                      </td>


                      <td>
                        {money(
                          month.sales
                        )}
                      </td>


                      <td>
                        {money(
                          month.refunds
                        )}
                      </td>


                      <td>

                        <strong>
                          {money(
                            month.netSales
                          )}
                        </strong>

                      </td>


                      <td>
                        {money(
                          month.expenses
                        )}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}


export default Reports;