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
  ShoppingCart,
  ShoppingBag,
  LogOut,
  User,
} from "lucide-react";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import Sales from "./pages/Sales";
import Login from "./pages/Login";

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
                {user?.role || "user"}
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
          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/products"
            element={<Products />}
          />

          <Route
            path="/suppliers"
            element={<Suppliers />}
          />

          <Route
            path="/purchases"
            element={<Purchases />}
          />

          <Route
            path="/sales"
            element={<Sales />}
          />

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