import { useEffect, useState } from "react";

import {
  Package,
  Truck,
  ShoppingCart,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

import {
  getDashboardSummary,
} from "../services/dashboardService";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getDashboardSummary();

      setDashboard(result.data || null);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="products-state">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="products-state error-state">
          <p>{error}</p>

          <button
            type="button"
            onClick={fetchDashboard}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const data = dashboard || {};

  const lowStockProducts =
    data.lowStockProducts || [];

  const recentSales =
    data.recentSales || [];

  const recentPurchases =
    data.recentPurchases || [];

  const topSellingProducts =
    data.topSellingProducts || [];

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>

          <p>
            Overview of your supermarket
            operations.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-refresh-btn"
          onClick={fetchDashboard}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="dashboard-card-icon">
            <Package size={22} />
          </div>

          <div>
            <span>Total Products</span>

            <strong>
              {data.totalProducts || 0}
            </strong>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">
            <Truck size={22} />
          </div>

          <div>
            <span>Active Suppliers</span>

            <strong>
              {data.totalSuppliers || 0}
            </strong>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">
            <ShoppingCart size={22} />
          </div>

          <div>
            <span>Total Purchases</span>

            <strong>
              {data.totalPurchases || 0}
            </strong>

            <small>
              Rs.{" "}
              {Number(
                data.totalPurchaseValue || 0
              ).toLocaleString()}
            </small>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">
            <ShoppingBag size={22} />
          </div>

          <div>
            <span>Total Sales</span>

            <strong>
              {data.totalSales || 0}
            </strong>

            <small>
              Rs.{" "}
              {Number(
                data.totalSalesRevenue || 0
              ).toLocaleString()}
            </small>
          </div>
        </div>

        <div className="dashboard-card warning-card">
          <div className="dashboard-card-icon warning-icon">
            <AlertTriangle size={22} />
          </div>

          <div>
            <span>Low Stock</span>

            <strong>
              {data.lowStockCount || 0}
            </strong>

            <small>
              Products need attention
            </small>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-icon">
            <TrendingUp size={22} />
          </div>

          <div>
            <span>Sales Revenue</span>

            <strong className="dashboard-money">
              Rs.{" "}
              {Number(
                data.totalSalesRevenue || 0
              ).toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Recent Sales */}
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Recent Sales</h2>

              <p>
                Latest completed transactions.
              </p>
            </div>

            <ShoppingBag size={19} />
          </div>

          {recentSales.length === 0 ? (
            <div className="dashboard-empty">
              No sales recorded yet.
            </div>
          ) : (
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Sale</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Payment</th>
                  </tr>
                </thead>

                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale._id}>
                      <td>
                        <span className="dashboard-code">
                          {sale.saleNumber}
                        </span>
                      </td>

                      <td>
                        {sale.customerName ||
                          "Walk-in Customer"}
                      </td>

                      <td>
                        <strong>
                          Rs.{" "}
                          {Number(
                            sale.totalAmount
                          ).toLocaleString()}
                        </strong>
                      </td>

                      <td>
                        <span className="dashboard-payment">
                          {sale.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Purchases */}
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Recent Purchases</h2>

              <p>
                Latest supplier restocking.
              </p>
            </div>

            <ShoppingCart size={19} />
          </div>

          {recentPurchases.length === 0 ? (
            <div className="dashboard-empty">
              No purchases recorded yet.
            </div>
          ) : (
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Purchase</th>
                    <th>Supplier</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recentPurchases.map(
                    (purchase) => (
                      <tr key={purchase._id}>
                        <td>
                          <span className="dashboard-code">
                            {
                              purchase.purchaseNumber
                            }
                          </span>
                        </td>

                        <td>
                          {purchase.supplierName}
                        </td>

                        <td>
                          <strong>
                            Rs.{" "}
                            {Number(
                              purchase.totalAmount
                            ).toLocaleString()}
                          </strong>
                        </td>

                        <td>
                          {new Date(
                            purchase.purchaseDate
                          ).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Low Stock Products</h2>

              <p>
                Products at or below minimum
                stock level.
              </p>
            </div>

            <AlertTriangle size={19} />
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="dashboard-empty">
              All products have sufficient stock.
            </div>
          ) : (
            <div className="dashboard-list">
              {lowStockProducts.map(
                (product) => (
                  <div
                    className="dashboard-list-item"
                    key={product._id}
                  >
                    <div>
                      <strong>
                        {product.name}
                      </strong>

                      <span>
                        {product.sku}
                      </span>
                    </div>

                    <div className="dashboard-low-stock">
                      <AlertTriangle
                        size={14}
                      />

                      {product.quantity}{" "}
                      {product.unit}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h2>Top Selling Products</h2>

              <p>
                Products with the highest
                quantity sold.
              </p>
            </div>

            <TrendingUp size={19} />
          </div>

          {topSellingProducts.length === 0 ? (
            <div className="dashboard-empty">
              No sales data available yet.
            </div>
          ) : (
            <div className="dashboard-list">
              {topSellingProducts.map(
                (product, index) => (
                  <div
                    className="dashboard-list-item"
                    key={
                      product._id ||
                      `${product.sku}-${index}`
                    }
                  >
                    <div className="dashboard-rank">
                      {index + 1}
                    </div>

                    <div className="dashboard-product-info">
                      <strong>
                        {product.productName}
                      </strong>

                      <span>
                        {product.sku}
                      </span>
                    </div>

                    <div className="dashboard-product-sales">
                      <strong>
                        {product.quantitySold}
                      </strong>

                      <span>
                        sold
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;