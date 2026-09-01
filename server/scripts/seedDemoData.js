require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const Purchase = require("../models/Purchase");
const Sale = require("../models/Sale");
const Customer = require("../models/Customer");
const Return = require("../models/Return");
const Expense = require("../models/Expense");
const User = require("../models/User");


// ======================================================
// DATE HELPER
// ======================================================

const date = (value) =>
  new Date(`${value}+05:00`);


// ======================================================
// MAIN SEED
// ======================================================

const seedDemoData = async () => {
  try {
    await connectDB();

    console.log("\nConnected to MongoDB...");
    console.log("Checking database...\n");


    // ==================================================
    // SAFETY CHECK
    // ==================================================

    const existingData =
      (await Product.countDocuments()) +
      (await Supplier.countDocuments()) +
      (await Purchase.countDocuments()) +
      (await Sale.countDocuments()) +
      (await Customer.countDocuments()) +
      (await Return.countDocuments()) +
      (await Expense.countDocuments());


    if (existingData > 0) {
      console.log(
        "Seed stopped: business data already exists."
      );

      console.log(
        "Run resetDemoData.js first if you want a fresh demo."
      );

      return;
    }


    // ==================================================
    // ADMIN USER
    // ==================================================

    const admin =
      (await User.findOne({
        role: "admin",
      })) || null;


    console.log(
      admin
        ? `Using admin: ${admin.name}`
        : "Admin not found. Optional user references will remain empty."
    );


    // ==================================================
    // SUPPLIERS
    // ==================================================

    console.log("\nCreating suppliers...");


    const suppliers =
      await Supplier.insertMany([
        {
          name: "Awan Wholesale Mart",
          contactPerson: "Imran Awan",
          phone: "0300-0000101",
          email:
            "sales@awanwholesale.example",
          address:
            "College Road",
          city: "Rawalpindi",
          company:
            "Awan Wholesale Mart",
          notes:
            "Beverages and general grocery supplier",
          status: "active",
        },

        {
          name: "Al-Hamd Distributors",
          contactPerson:
            "Shahid Mehmood",
          phone: "0300-0000102",
          email:
            "orders@alhamd.example",
          address:
            "I-9 Industrial Area",
          city: "Islamabad",
          company:
            "Al-Hamd Distributors",
          notes:
            "Dairy and grocery distributor",
          status: "active",
        },

        {
          name: "Rana Traders",
          contactPerson:
            "Kamran Rana",
          phone: "0300-0000103",
          email:
            "rana@traders.example",
          address:
            "Commercial Market",
          city: "Rawalpindi",
          company:
            "Rana Traders",
          notes:
            "Household and personal care supplier",
          status: "active",
        },

        {
          name:
            "New Islamabad Traders",
          contactPerson:
            "Waqas Ahmed",
          phone: "0300-0000104",
          email:
            "orders@nit.example",
          address:
            "G-10 Markaz",
          city: "Islamabad",
          company:
            "New Islamabad Traders",
          notes:
            "Grocery and snacks supplier",
          status: "active",
        },
      ]);


    const supplierMap = {};

    suppliers.forEach(
      (supplier) => {
        supplierMap[supplier.name] =
          supplier;
      }
    );


    console.log(
      `${suppliers.length} suppliers created.`
    );


    // ==================================================
    // PRODUCTS
    // ==================================================

    console.log("\nCreating products...");


    const products =
      await Product.insertMany([
        {
          name: "Coca Cola 1.5L",
          sku: "COKE-15L",
          category: "Beverages",
          purchasePrice: 150,
          sellingPrice: 185,
          quantity: 0,
          minimumStockLevel: 20,
          supplier:
            "Awan Wholesale Mart",
          unit: "pcs",
          description:
            "1.5 litre bottle",
        },

        {
          name: "Pepsi 1.5L",
          sku: "PEPSI-15L",
          category: "Beverages",
          purchasePrice: 148,
          sellingPrice: 180,
          quantity: 0,
          minimumStockLevel: 20,
          supplier:
            "Awan Wholesale Mart",
          unit: "pcs",
          description:
            "1.5 litre bottle",
        },

        {
          name:
            "Nestle Water 1.5L",
          sku: "WATER-15L",
          category: "Beverages",
          purchasePrice: 72,
          sellingPrice: 95,
          quantity: 0,
          minimumStockLevel: 24,
          supplier:
            "Awan Wholesale Mart",
          unit: "pcs",
          description:
            "Regular bottled water",
        },

        {
          name: "Milkpak 1L",
          sku: "MILK-1L",
          category: "Dairy",
          purchasePrice: 245,
          sellingPrice: 285,
          quantity: 0,
          minimumStockLevel: 12,
          supplier:
            "Al-Hamd Distributors",
          unit: "pcs",
          description:
            "1 litre pack",
        },

        {
          name: "Surf Excel 1kg",
          sku: "SURF-1KG",
          category: "Household",
          purchasePrice: 530,
          sellingPrice: 625,
          quantity: 0,
          minimumStockLevel: 8,
          supplier:
            "Rana Traders",
          unit: "pcs",
          description:
            "1kg detergent pack",
        },

        {
          name: "Lux Soap 100g",
          sku: "LUX-100",
          category:
            "Personal Care",
          purchasePrice: 145,
          sellingPrice: 180,
          quantity: 0,
          minimumStockLevel: 15,
          supplier:
            "Rana Traders",
          unit: "pcs",
          description:
            "100g soap bar",
        },

        {
          name:
            "Tapal Danedar 430g",
          sku: "TAPAL-430",
          category: "Grocery",
          purchasePrice: 620,
          sellingPrice: 710,
          quantity: 0,
          minimumStockLevel: 8,
          supplier:
            "New Islamabad Traders",
          unit: "pcs",
          description:
            "430g family pack",
        },

        {
          name:
            "National Salt 800g",
          sku: "SALT-800",
          category: "Grocery",
          purchasePrice: 58,
          sellingPrice: 75,
          quantity: 0,
          minimumStockLevel: 15,
          supplier:
            "Al-Hamd Distributors",
          unit: "pcs",
          description:
            "800g pack",
        },

        {
          name: "Cooking Oil 1L",
          sku: "OIL-1L",
          category: "Grocery",
          purchasePrice: 500,
          sellingPrice: 560,
          quantity: 0,
          minimumStockLevel: 10,
          supplier:
            "New Islamabad Traders",
          unit: "pcs",
          description: "",
        },

        {
          name:
            "Shan Chicken Masala",
          sku: "SHAN-CHK",
          category: "Grocery",
          purchasePrice: 130,
          sellingPrice: 165,
          quantity: 0,
          minimumStockLevel: 12,
          supplier:
            "Rana Traders",
          unit: "pcs",
          description:
            "Regular retail pack",
        },

        {
          name: "Lays Masala 90g",
          sku: "LAYS-MAS90",
          category: "Snacks",
          purchasePrice: 110,
          sellingPrice: 140,
          quantity: 0,
          minimumStockLevel: 18,
          supplier:
            "New Islamabad Traders",
          unit: "pcs",
          description: "",
        },

        {
          name: "Sugar 1kg",
          sku: "SUGAR-1KG",
          category: "Grocery",
          purchasePrice: 155,
          sellingPrice: 175,
          quantity: 0,
          minimumStockLevel: 20,
          supplier:
            "Al-Hamd Distributors",
          unit: "kg",
          description:
            "1kg retail pack",
        },
      ]);


    const productMap = {};

    products.forEach(
      (product) => {
        productMap[product.sku] =
          product;
      }
    );


    console.log(
      `${products.length} products created.`
    );


    // ==================================================
    // PURCHASE HELPER
    // ==================================================

    const createPurchase =
      async ({
        purchaseNumber,
        supplierName,
        invoiceNumber,
        purchaseDate,
        notes = "",
        items,
      }) => {

        const supplier =
          supplierMap[
            supplierName
          ];


        const purchaseItems =
          items.map(
            ({
              sku,
              quantity,
              price,
            }) => {

              const product =
                productMap[sku];

              return {
                product:
                  product._id,

                productName:
                  product.name,

                sku:
                  product.sku,

                quantity,

                purchasePrice:
                  price,

                subtotal:
                  quantity *
                  price,
              };
            }
          );


        const totalAmount =
          purchaseItems.reduce(
            (
              total,
              item
            ) =>
              total +
              item.subtotal,
            0
          );


        const purchase =
          await Purchase.create({
            purchaseNumber,

            supplier:
              supplier._id,

            supplierName:
              supplier.name,

            invoiceNumber,

            items:
              purchaseItems,

            totalAmount,

            purchaseDate,

            notes,

            status:
              "received",
          });


        // Stock IN
        for (
          const item
          of purchaseItems
        ) {
          await Product.findByIdAndUpdate(
            item.product,
            {
              $inc: {
                quantity:
                  item.quantity,
              },
            }
          );
        }


        return purchase;
      };


    // ==================================================
    // PURCHASES
    // ==================================================

    console.log("\nCreating purchases...");


    await createPurchase({
      purchaseNumber:
        "PUR-2026-0825-01",

      supplierName:
        "Awan Wholesale Mart",

      invoiceNumber:
        "AWM-8421",

      purchaseDate:
        date(
          "2026-08-25T10:15:00"
        ),

      notes:
        "Beverage restock",

      items: [
        {
          sku: "COKE-15L",
          quantity: 72,
          price: 150,
        },
        {
          sku: "PEPSI-15L",
          quantity: 72,
          price: 148,
        },
        {
          sku: "WATER-15L",
          quantity: 96,
          price: 72,
        },
      ],
    });


    await createPurchase({
      purchaseNumber:
        "PUR-2026-0826-01",

      supplierName:
        "Al-Hamd Distributors",

      invoiceNumber:
        "AHD-1187",

      purchaseDate:
        date(
          "2026-08-26T11:40:00"
        ),

      items: [
        {
          sku: "MILK-1L",
          quantity: 48,
          price: 245,
        },
        {
          sku: "SUGAR-1KG",
          quantity: 80,
          price: 155,
        },
        {
          sku: "SALT-800",
          quantity: 60,
          price: 58,
        },
      ],
    });


    await createPurchase({
      purchaseNumber:
        "PUR-2026-0827-01",

      supplierName:
        "Rana Traders",

      invoiceNumber:
        "RT-5634",

      purchaseDate:
        date(
          "2026-08-27T14:20:00"
        ),

      items: [
        {
          sku: "SURF-1KG",
          quantity: 24,
          price: 530,
        },
        {
          sku: "LUX-100",
          quantity: 60,
          price: 145,
        },
        {
          sku: "SHAN-CHK",
          quantity: 48,
          price: 130,
        },
      ],
    });


    await createPurchase({
      purchaseNumber:
        "PUR-2026-0829-01",

      supplierName:
        "New Islamabad Traders",

      invoiceNumber:
        "NIT-3096",

      purchaseDate:
        date(
          "2026-08-29T09:35:00"
        ),

      items: [
        {
          sku: "TAPAL-430",
          quantity: 30,
          price: 620,
        },
        {
          sku: "LAYS-MAS90",
          quantity: 72,
          price: 110,
        },
        {
          sku: "OIL-1L",
          quantity: 36,
          price: 500,
        },
      ],
    });


    await createPurchase({
      purchaseNumber:
        "PUR-2026-0901-01",

      supplierName:
        "Awan Wholesale Mart",

      invoiceNumber:
        "AWM-8519",

      purchaseDate:
        date(
          "2026-09-01T09:10:00"
        ),

      items: [
        {
          sku: "COKE-15L",
          quantity: 48,
          price: 150,
        },
        {
          sku: "PEPSI-15L",
          quantity: 48,
          price: 148,
        },
        {
          sku: "WATER-15L",
          quantity: 72,
          price: 72,
        },
      ],
    });


    await createPurchase({
      purchaseNumber:
        "PUR-2026-0901-02",

      supplierName:
        "Al-Hamd Distributors",

      invoiceNumber:
        "AHD-1224",

      purchaseDate:
        date(
          "2026-09-01T12:25:00"
        ),

      items: [
        {
          sku: "MILK-1L",
          quantity: 36,
          price: 245,
        },
        {
          sku: "SUGAR-1KG",
          quantity: 40,
          price: 155,
        },
      ],
    });


    console.log(
      "6 purchases created and stock increased."
    );


    // ==================================================
    // CUSTOMERS
    // ==================================================

    console.log("\nCreating customers...");


    const customers =
      await Customer.insertMany([
        {
          name: "Ali Raza",
          phone:
            "0300-0000201",
          city: "Islamabad",
          address: "G-11",
          status: "active",
        },

        {
          name: "Hina Khalid",
          phone:
            "0300-0000202",
          city: "Rawalpindi",
          address:
            "Satellite Town",
          status: "active",
        },

        {
          name: "Usman Tariq",
          phone:
            "0300-0000203",
          city: "Islamabad",
          address: "I-8",
          status: "active",
        },

        {
          name: "Sara Ahmed",
          phone:
            "0300-0000204",
          city: "Rawalpindi",
          address:
            "Bahria Town",
          status: "active",
        },

        {
          name:
            "Bilal Mehmood",
          phone:
            "0300-0000205",
          city: "Islamabad",
          address: "G-10",
          status: "active",
        },
      ]);


    const customerMap = {};

    customers.forEach(
      (customer) => {
        customerMap[
          customer.name
        ] = customer;
      }
    );


    console.log(
      `${customers.length} customers created.`
    );


    // ==================================================
    // SALE HELPER
    // ==================================================

    const createSale =
      async ({
        saleNumber,
        customerName,
        items,
        discount = 0,
        paymentMethod = "cash",
        saleDate,
        notes = "",
      }) => {

        const customer =
          customerName &&
          customerName !==
            "Walk-in Customer"
            ? customerMap[
                customerName
              ]
            : null;


        const saleItems = [];


        for (
          const {
            sku,
            quantity,
          }
          of items
        ) {

          const product =
            await Product.findOne({
              sku,
            });


          if (!product) {
            throw new Error(
              `Product not found: ${sku}`
            );
          }


          if (
            product.quantity <
            quantity
          ) {
            throw new Error(
              `Insufficient stock for ${product.name}`
            );
          }


          saleItems.push({
            product:
              product._id,

            productName:
              product.name,

            sku:
              product.sku,

            quantity,

            sellingPrice:
              product.sellingPrice,

            purchasePrice:
              product.purchasePrice,

            subtotal:
              quantity *
              product.sellingPrice,
          });
        }


        const subtotalAmount =
          saleItems.reduce(
            (
              total,
              item
            ) =>
              total +
              item.subtotal,
            0
          );


        const totalAmount =
          subtotalAmount -
          discount;


        const sale =
          await Sale.create({
            saleNumber,

            customer:
              customer?._id ||
              null,

            customerName:
              customer?.name ||
              "Walk-in Customer",

            items:
              saleItems,

            subtotalAmount,

            discount,

            totalAmount,

            paymentMethod,

            saleDate,

            notes,

            status:
              "completed",
          });


        // Stock OUT
        for (
          const item
          of saleItems
        ) {
          await Product.findByIdAndUpdate(
            item.product,
            {
              $inc: {
                quantity:
                  -item.quantity,
              },
            }
          );
        }


        return sale;
      };


    // ==================================================
    // SALES
    // ==================================================

    console.log("\nCreating sales...");


    const sales = {};


    sales.s1 =
      await createSale({
        saleNumber:
          "SAL-2026-0829-01",

        customerName:
          "Walk-in Customer",

        saleDate:
          date(
            "2026-08-29T16:10:00"
          ),

        paymentMethod:
          "cash",

        items: [
          {
            sku: "COKE-15L",
            quantity: 2,
          },
          {
            sku: "LAYS-MAS90",
            quantity: 3,
          },
          {
            sku: "SUGAR-1KG",
            quantity: 1,
          },
        ],
      });


    sales.s2 =
      await createSale({
        saleNumber:
          "SAL-2026-0829-02",

        customerName:
          "Ali Raza",

        saleDate:
          date(
            "2026-08-29T18:25:00"
          ),

        paymentMethod:
          "card",

        discount: 55,

        items: [
          {
            sku: "MILK-1L",
            quantity: 2,
          },
          {
            sku: "SURF-1KG",
            quantity: 1,
          },
          {
            sku: "LUX-100",
            quantity: 2,
          },
        ],
      });


    sales.s3 =
      await createSale({
        saleNumber:
          "SAL-2026-0830-01",

        customerName:
          "Hina Khalid",

        saleDate:
          date(
            "2026-08-30T11:45:00"
          ),

        paymentMethod:
          "cash",

        items: [
          {
            sku: "PEPSI-15L",
            quantity: 2,
          },
          {
            sku: "WATER-15L",
            quantity: 6,
          },
          {
            sku: "SHAN-CHK",
            quantity: 2,
          },
        ],
      });


    sales.s4 =
      await createSale({
        saleNumber:
          "SAL-2026-0830-02",

        customerName:
          "Walk-in Customer",

        saleDate:
          date(
            "2026-08-30T17:20:00"
          ),

        paymentMethod:
          "cash",

        discount: 35,

        items: [
          {
            sku: "TAPAL-430",
            quantity: 1,
          },
          {
            sku: "SUGAR-1KG",
            quantity: 2,
          },
          {
            sku: "SALT-800",
            quantity: 1,
          },
        ],
      });


    sales.s5 =
      await createSale({
        saleNumber:
          "SAL-2026-0831-01",

        customerName:
          "Usman Tariq",

        saleDate:
          date(
            "2026-08-31T12:05:00"
          ),

        paymentMethod:
          "card",

        items: [
          {
            sku: "OIL-1L",
            quantity: 2,
          },
          {
            sku: "MILK-1L",
            quantity: 1,
          },
          {
            sku: "LUX-100",
            quantity: 1,
          },
        ],
      });


    sales.s6 =
      await createSale({
        saleNumber:
          "SAL-2026-0831-02",

        customerName:
          "Walk-in Customer",

        saleDate:
          date(
            "2026-08-31T19:15:00"
          ),

        paymentMethod:
          "cash",

        items: [
          {
            sku: "COKE-15L",
            quantity: 1,
          },
          {
            sku: "LAYS-MAS90",
            quantity: 2,
          },
          {
            sku: "WATER-15L",
            quantity: 2,
          },
        ],
      });


    sales.s7 =
      await createSale({
        saleNumber:
          "SAL-2026-0901-01",

        customerName:
          "Sara Ahmed",

        saleDate:
          date(
            "2026-09-01T11:30:00"
          ),

        paymentMethod:
          "card",

        discount: 55,

        items: [
          {
            sku: "SURF-1KG",
            quantity: 2,
          },
          {
            sku: "LUX-100",
            quantity: 3,
          },
          {
            sku: "SHAN-CHK",
            quantity: 1,
          },
        ],
      });


    sales.s8 =
      await createSale({
        saleNumber:
          "SAL-2026-0901-02",

        customerName:
          "Walk-in Customer",

        saleDate:
          date(
            "2026-09-01T15:45:00"
          ),

        paymentMethod:
          "cash",

        items: [
          {
            sku: "PEPSI-15L",
            quantity: 3,
          },
          {
            sku: "COKE-15L",
            quantity: 2,
          },
          {
            sku: "LAYS-MAS90",
            quantity: 4,
          },
        ],
      });


    sales.s9 =
      await createSale({
        saleNumber:
          "SAL-2026-0901-03",

        customerName:
          "Bilal Mehmood",

        saleDate:
          date(
            "2026-09-01T19:05:00"
          ),

        paymentMethod:
          "bank",

        items: [
          {
            sku: "TAPAL-430",
            quantity: 2,
          },
          {
            sku: "SUGAR-1KG",
            quantity: 3,
          },
          {
            sku: "MILK-1L",
            quantity: 2,
          },
        ],
      });


    sales.s10 =
      await createSale({
        saleNumber:
          "SAL-2026-0902-01",

        customerName:
          "Hina Khalid",

        saleDate:
          date(
            "2026-09-02T10:40:00"
          ),

        paymentMethod:
          "cash",

        discount: 20,

        items: [
          {
            sku: "WATER-15L",
            quantity: 12,
          },
          {
            sku: "COKE-15L",
            quantity: 2,
          },
          {
            sku: "PEPSI-15L",
            quantity: 2,
          },
        ],
      });


    sales.s11 =
      await createSale({
        saleNumber:
          "SAL-2026-0902-02",

        customerName:
          "Ali Raza",

        saleDate:
          date(
            "2026-09-02T14:15:00"
          ),

        paymentMethod:
          "card",

        items: [
          {
            sku: "OIL-1L",
            quantity: 1,
          },
          {
            sku: "SURF-1KG",
            quantity: 1,
          },
          {
            sku: "SHAN-CHK",
            quantity: 3,
          },
          {
            sku: "LUX-100",
            quantity: 2,
          },
        ],
      });


    sales.s12 =
      await createSale({
        saleNumber:
          "SAL-2026-0902-03",

        customerName:
          "Walk-in Customer",

        saleDate:
          date(
            "2026-09-02T18:35:00"
          ),

        paymentMethod:
          "cash",

        items: [
          {
            sku: "SALT-800",
            quantity: 4,
          },
          {
            sku: "SUGAR-1KG",
            quantity: 4,
          },
          {
            sku: "LAYS-MAS90",
            quantity: 5,
          },
        ],
      });


    console.log(
      "12 realistic sales created."
    );


    // ==================================================
    // RETURN HELPER
    // ==================================================

    const createReturn =
      async ({
        returnNumber,
        sale,
        sku,
        quantity,
        refundMethod,
        reason,
        returnDate,
      }) => {

        const originalItem =
          sale.items.find(
            (item) =>
              item.sku === sku
          );


        if (!originalItem) {
          throw new Error(
            `Return item ${sku} not found in sale ${sale.saleNumber}`
          );
        }


        const refundSubtotal =
          originalItem.sellingPrice *
          quantity;


        const returnRecord =
          await Return.create({
            returnNumber,

            sale:
              sale._id,

            saleNumber:
              sale.saleNumber,

            customer:
              sale.customer ||
              null,

            customerName:
              sale.customerName,

            items: [
              {
                product:
                  originalItem.product,

                productName:
                  originalItem.productName,

                sku:
                  originalItem.sku,

                quantity,

                sellingPrice:
                  originalItem.sellingPrice,

                refundSubtotal,
              },
            ],

            totalRefund:
              refundSubtotal,

            refundMethod,

            reason,

            returnDate,

            processedBy:
              admin?._id ||
              null,

            status:
              "completed",
          });


        // Stock restored
        await Product.findByIdAndUpdate(
          originalItem.product,
          {
            $inc: {
              quantity,
            },
          }
        );


        return returnRecord;
      };


    // ==================================================
    // RETURNS
    // ==================================================

    console.log("\nCreating returns...");


    await createReturn({
      returnNumber:
        "RET-2026-0902-01",

      sale: sales.s10,

      sku: "COKE-15L",

      quantity: 1,

      refundMethod:
        "cash",

      reason:
        "Bottle damaged / leaking",

      returnDate:
        date(
          "2026-09-02T13:20:00"
        ),
    });


    await createReturn({
      returnNumber:
        "RET-2026-0902-02",

      sale: sales.s2,

      sku: "LUX-100",

      quantity: 1,

      refundMethod:
        "card",

      reason:
        "Customer selected wrong item",

      returnDate:
        date(
          "2026-09-02T16:05:00"
        ),
    });


    console.log(
      "2 returns created and stock restored."
    );


    // ==================================================
    // EXPENSES
    // ==================================================

    console.log("\nCreating expenses...");


    await Expense.insertMany([
      {
        expenseNumber:
          "EXP-2026-0830-01",

        title:
          "Local stock delivery",

        category:
          "transport",

        amount: 850,

        expenseDate:
          date(
            "2026-08-30T09:30:00"
          ),

        paymentMethod:
          "cash",

        vendor:
          "Local Delivery Service",

        reference:
          "TR-0830",

        notes:
          "Delivery charges for incoming stock",

        recordedBy:
          admin?._id ||
          null,

        status:
          "active",
      },

      {
        expenseNumber:
          "EXP-2026-0901-01",

        title:
          "Receipt rolls and shopping bags",

        category:
          "supplies",

        amount: 620,

        expenseDate:
          date(
            "2026-09-01T13:10:00"
          ),

        paymentMethod:
          "cash",

        vendor:
          "City Packaging",

        reference:
          "CP-119",

        notes:
          "Counter consumables",

        recordedBy:
          admin?._id ||
          null,

        status:
          "active",
      },

      {
        expenseNumber:
          "EXP-2026-0902-01",

        title:
          "Counter barcode scanner repair",

        category:
          "maintenance",

        amount: 380,

        expenseDate:
          date(
            "2026-09-02T12:25:00"
          ),

        paymentMethod:
          "cash",

        vendor:
          "Tech Point Services",

        reference:
          "TPS-442",

        notes:
          "Scanner cable and servicing",

        recordedBy:
          admin?._id ||
          null,

        status:
          "active",
      },
    ]);


    console.log(
      "3 expenses created."
    );


    // ==================================================
    // FINAL VERIFICATION
    // ==================================================

    const finalCounts = {
      products:
        await Product.countDocuments(),

      suppliers:
        await Supplier.countDocuments(),

      purchases:
        await Purchase.countDocuments(),

      customers:
        await Customer.countDocuments(),

      sales:
        await Sale.countDocuments(),

      returns:
        await Return.countDocuments(),

      expenses:
        await Expense.countDocuments(),
    };


    const totalSales =
      await Sale.aggregate([
        {
          $match: {
            status:
              "completed",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum:
                "$totalAmount",
            },
          },
        },
      ]);


    const totalRefunds =
      await Return.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum:
                "$totalRefund",
            },
          },
        },
      ]);


    console.log(
      "\n========================================"
    );

    console.log(
      "DEMO DATA CREATED SUCCESSFULLY"
    );

    console.log(
      "========================================"
    );

    console.log(finalCounts);

    console.log(
      `Gross Sales: Rs. ${
        totalSales[0]?.total ||
        0
      }`
    );

    console.log(
      `Refunds: Rs. ${
        totalRefunds[0]
          ?.total || 0
      }`
    );

    console.log(
      "Expected Reports Cost Coverage: 100%"
    );

    console.log(
      "\nUsers/login accounts were not modified."
    );

  } catch (error) {
    console.error(
      "\nDemo seed failed:"
    );

    console.error(error);

    console.log(
      "\nIf the script stopped halfway, run resetDemoData.js before trying again."
    );

  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};


seedDemoData();