require("dotenv").config();

const connectDB = require("../config/db");

const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const Purchase = require("../models/Purchase");
const Sale = require("../models/Sale");
const Customer = require("../models/Customer");
const Return = require("../models/Return");
const Expense = require("../models/Expense");

const mongoose = require("mongoose");

const resetDemoData = async () => {
  try {
    await connectDB();

    console.log("Connected to MongoDB...");

    await Return.deleteMany({});
    console.log("Returns cleared");

    await Sale.deleteMany({});
    console.log("Sales cleared");

    await Expense.deleteMany({});
    console.log("Expenses cleared");

    await Purchase.deleteMany({});
    console.log("Purchases cleared");

    await Customer.deleteMany({});
    console.log("Customers cleared");

    await Product.deleteMany({});
    console.log("Products cleared");

    await Supplier.deleteMany({});
    console.log("Suppliers cleared");

    console.log(
      "\nDemo business data reset successfully."
    );

    console.log(
      "Users were NOT deleted."
    );

  } catch (error) {
    console.error(
      "Reset failed:",
      error
    );
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

resetDemoData();