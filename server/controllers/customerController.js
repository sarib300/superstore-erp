const Customer = require("../models/Customer");
const Sale = require("../models/Sale");


// GET ALL CUSTOMERS
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
};


// GET SINGLE CUSTOMER
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(
      req.params.id
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
    });
  }
};


// GET CUSTOMER PURCHASE HISTORY + STATS
const getCustomerHistory = async (req, res) => {
  try {
    const customer = await Customer.findById(
      req.params.id
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const sales = await Sale.find({
      customer: customer._id,
      status: "completed",
    })
      .populate(
        "items.product",
        "name sku unit"
      )
      .sort({
        saleDate: -1,
        createdAt: -1,
      });


    const totalPurchases =
      sales.length;


    const totalSpent =
      sales.reduce(
        (total, sale) =>
          total +
          Number(
            sale.totalAmount || 0
          ),
        0
      );


    const lastPurchase =
      sales.length > 0
        ? sales[0].saleDate
        : null;


    res.status(200).json({
      success: true,

      data: {
        customer,

        stats: {
          totalPurchases,
          totalSpent,
          lastPurchase,
        },

        sales,
      },
    });

  } catch (error) {
    console.error(
      "Get customer history error:",
      error
    );

    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch customer purchase history",
    });
  }
};


// CREATE CUSTOMER
const createCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      city,
      notes,
      status,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    const customer = await Customer.create({
      name: name.trim(),
      phone: phone?.trim() || "",
      email: email?.trim().toLowerCase() || "",
      address: address?.trim() || "",
      city: city?.trim() || "",
      notes: notes?.trim() || "",
      status:
        status === "inactive"
          ? "inactive"
          : "active",
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create customer",
    });
  }
};


// UPDATE CUSTOMER
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(
      req.params.id
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const {
      name,
      phone,
      email,
      address,
      city,
      notes,
      status,
    } = req.body;


    if (name !== undefined) {
      customer.name =
        name.trim();
    }


    if (phone !== undefined) {
      customer.phone =
        phone.trim();
    }


    if (email !== undefined) {
      customer.email =
        email
          .trim()
          .toLowerCase();
    }


    if (address !== undefined) {
      customer.address =
        address.trim();
    }


    if (city !== undefined) {
      customer.city =
        city.trim();
    }


    if (notes !== undefined) {
      customer.notes =
        notes.trim();
    }


    if (status !== undefined) {
      if (
        ![
          "active",
          "inactive",
        ].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid customer status",
        });
      }

      customer.status =
        status;
    }


    await customer.save();


    res.status(200).json({
      success: true,
      message:
        "Customer updated successfully",
      data: customer,
    });

  } catch (error) {
    console.error(
      "Update customer error:",
      error
    );

    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid customer ID",
      });
    }


    res.status(500).json({
      success: false,
      message:
        "Failed to update customer",
    });
  }
};


// DELETE CUSTOMER
const deleteCustomer = async (req, res) => {
  try {
    const customer =
      await Customer.findById(
        req.params.id
      );


    if (!customer) {
      return res.status(404).json({
        success: false,
        message:
          "Customer not found",
      });
    }


    const hasSales =
      await Sale.exists({
        customer: customer._id,
      });


    if (hasSales) {
      return res.status(400).json({
        success: false,
        message:
          "Customer has sales history. Deactivate the customer instead of deleting.",
      });
    }


    await customer.deleteOne();


    res.status(200).json({
      success: true,
      message:
        "Customer deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete customer error:",
      error
    );


    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid customer ID",
      });
    }


    res.status(500).json({
      success: false,
      message:
        "Failed to delete customer",
    });
  }
};


module.exports = {
  getCustomers,
  getCustomerById,
  getCustomerHistory,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};