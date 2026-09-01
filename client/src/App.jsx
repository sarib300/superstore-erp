import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Package,
  Truck,
  RotateCcw,
   BarChart3,
  ShoppingCart,
  ShoppingBag,
  LogOut,
  User,
  WalletCards,
  ContactRound,
  Users as UsersIcon,
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import Sales from "./pages/Sales";
import Login from "./pages/Login";
import Users from "./pages/Users";
import Customers from "./pages/Customers";
import Returns from "./pages/Returns";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";

import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";


function ERPLayout() {
  const navigate = useNavigate();

  let user = null;

  try {
    const savedUser =
      localStorage.getItem("erp_user");

    if (savedUser) {
      user = JSON.parse(savedUser);
    }
  } catch (error) {
    console.error(
      "Invalid stored user data:",
      error
    );
  }

  // =========================
  // ROLE PERMISSIONS
  // =========================

  const canAccessInventory =
    user?.role === "admin" ||
    user?.role === "manager" ||
    user?.role === "inventory_staff";

  const canAccessSales =
    user?.role === "admin" ||
    user?.role === "manager" ||
    user?.role === "cashier";

    const canAccessCustomers =
  user?.role === "admin" ||
  user?.role === "manager" ||
  user?.role === "cashier";

  const canAccessReports =
  user?.role === "admin" ||
  user?.role === "manager";

  const canAccessExpenses =
  user?.role === "admin" ||
  user?.role === "manager";

  const canAccessReturns =
  user?.role === "admin" ||
  user?.role === "manager" ||
  user?.role === "cashier";
    

  const isAdmin =
    user?.role === "admin";


  const handleLogout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div className="erp-layout">

      {/* Sidebar */}
      <aside className="erp-sidebar">

        <div className="erp-logo">
          <div className="erp-logo-icon">
            ERP
          </div>

          <div>
            <strong>
              SuperStore
            </strong>

            <span>
              ERP System
            </span>
          </div>
        </div>


        <nav className="erp-nav">

          {/* Dashboard - Everyone */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive
                ? "erp-nav-link active"
                : "erp-nav-link"
            }
          >
            <LayoutDashboard size={19} />
            Dashboard
          </NavLink>


          {/* Inventory Roles */}
          {canAccessInventory && (
            <>
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  isActive
                    ? "erp-nav-link active"
                    : "erp-nav-link"
                }
              >
                <Package size={19} />
                Products
              </NavLink>


              <NavLink
                to="/suppliers"
                className={({ isActive }) =>
                  isActive
                    ? "erp-nav-link active"
                    : "erp-nav-link"
                }
              >
                <Truck size={19} />
                Suppliers
              </NavLink>


              <NavLink
                to="/purchases"
                className={({ isActive }) =>
                  isActive
                    ? "erp-nav-link active"
                    : "erp-nav-link"
                }
              >
                <ShoppingCart size={19} />
                Purchases
              </NavLink>
            </>
          )}


          {/* Sales Roles */}
          {canAccessSales && (
            <NavLink
              to="/sales"
              className={({ isActive }) =>
                isActive
                  ? "erp-nav-link active"
                  : "erp-nav-link"
              }
            >
              <ShoppingBag size={19} />
              Sales / POS
            </NavLink>
          )}

{canAccessReturns && (
  <NavLink
    to="/returns"
    className={({ isActive }) =>
      isActive
        ? "erp-nav-link active"
        : "erp-nav-link"
    }
  >
    <RotateCcw size={19} />
    Returns & Refunds
  </NavLink>
)}

{canAccessExpenses && (
  <NavLink
    to="/expenses"
    className={({ isActive }) =>
      isActive
        ? "erp-nav-link active"
        : "erp-nav-link"
    }
  >
    <WalletCards size={19} />
    Expenses
  </NavLink>
)}

{canAccessReports && (
  <NavLink
    to="/reports"
    className={({ isActive }) =>
      isActive
        ? "erp-nav-link active"
        : "erp-nav-link"
    }
  >
    <BarChart3 size={19} />
    Reports & Analytics
  </NavLink>
)}

{/* Customers */}
{canAccessCustomers && (
  <NavLink
    to="/customers"
    className={({ isActive }) =>
      isActive
        ? "erp-nav-link active"
        : "erp-nav-link"
    }
  >
    <ContactRound size={19} />
    Customers
  </NavLink>
)}

          {/* Admin Only */}
          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                isActive
                  ? "erp-nav-link active"
                  : "erp-nav-link"
              }
            >
              <UsersIcon size={19} />
              Users & Staff
            </NavLink>
          )}

        </nav>


        {/* User / Logout */}
        <div className="erp-sidebar-user">

          <div className="erp-user-info">

            <div className="erp-user-icon">
              <User size={17} />
            </div>

            <div>
              <strong>
                {user?.name || "ERP User"}
              </strong>

              <span>
                {user?.role === "inventory_staff"
                  ? "Inventory Staff"
                  : user?.role || "user"}
              </span>
            </div>

          </div>


          <button
            type="button"
            className="erp-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>

      </aside>


      {/* Main Content */}
      <main className="erp-main">

        <Routes>

          {/* Root */}
          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />


          {/* Dashboard - Everyone */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />


          {/* Products */}
          <Route
            path="/products"
            element={
              canAccessInventory ? (
                <Products />
              ) : (
                <Navigate
                  to="/dashboard"
                  replace
                />
              )
            }
          />


          {/* Suppliers */}
          <Route
            path="/suppliers"
            element={
              canAccessInventory ? (
                <Suppliers />
              ) : (
                <Navigate
                  to="/dashboard"
                  replace
                />
              )
            }
          />


          {/* Purchases */}
          <Route
            path="/purchases"
            element={
              canAccessInventory ? (
                <Purchases />
              ) : (
                <Navigate
                  to="/dashboard"
                  replace
                />
              )
            }
          />


          {/* Sales / POS */}
          <Route
            path="/sales"
            element={
              canAccessSales ? (
                <Sales />
              ) : (
                <Navigate
                  to="/dashboard"
                  replace
                />
              )
            }
          />

<Route
  path="/returns"
  element={
    canAccessReturns ? (
      <Returns />
    ) : (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }
/>

<Route
  path="/expenses"
  element={
    canAccessExpenses ? (
      <Expenses />
    ) : (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }
/>

<Route
  path="/reports"
  element={
    canAccessReports ? (
      <Reports />
    ) : (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }
/>

{/* Customers */}
<Route
  path="/customers"
  element={
    canAccessCustomers ? (
      <Customers />
    ) : (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }
/>

          {/* Users - Admin Only */}
          <Route
            path="/users"
            element={
              isAdmin ? (
                <Users />
              ) : (
                <Navigate
                  to="/dashboard"
                  replace
                />
              )
            }
          />


          {/* Unknown Route */}
          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Routes>

      </main>

    </div>
  );
}


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Public Login */}
        <Route
          path="/login"
          element={<Login />}
        />


        {/* Protected ERP */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <ERPLayout />
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;