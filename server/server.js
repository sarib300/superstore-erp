const express = require("express");
const cors = require("cors");

require("dotenv").config();

const connectDB = require("./config/db");

const returnRoutes =
  require("./routes/returnRoutes");

const authRoutes = require(
    "./routes/authRoutes"
);

const reportRoutes =
  require("./routes/reportRoutes");

const customerRoutes = require(
  "./routes/customerRoutes"
);

const expenseRoutes =
  require("./routes/expenseRoutes");

const userRoutes = require(
  "./routes/userRoutes"
);

const productRoutes = require(
    "./routes/productRoutes"
);

const supplierRoutes = require(
    "./routes/supplierRoutes"
);

const purchaseRoutes = require(
    "./routes/purchaseRoutes"
);

const saleRoutes = require(
    "./routes/saleRoutes"
);

const dashboardRoutes = require(
    "./routes/dashboardRoutes"
);


const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use(
    "/api/auth",
    authRoutes
);

app.use(
  "/api/expenses",
  expenseRoutes
);

app.use(
  "/api/reports",
  reportRoutes
);

app.use(
  "/api/returns",
  returnRoutes
);

app.use(
  "/api/users",
  userRoutes
);

// Products
app.use(
    "/api/products",
    productRoutes
);

// Suppliers
app.use(
    "/api/suppliers",
    supplierRoutes
);

// Purchases
app.use(
    "/api/purchases",
    purchaseRoutes
);

// Sales
app.use(
    "/api/sales",
    saleRoutes
);

// Dashboard
app.use(
    "/api/dashboard",
    dashboardRoutes
);

// CustomerRoute
app.use(
  "/api/customers",
  customerRoutes
);


app.get("/", (req, res) => {
    res.json({
        success: true,
        message:
            "Super Store ERP API is running",
    });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Server running on port ${PORT}`
  );
});