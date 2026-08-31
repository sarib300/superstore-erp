const Supplier = require("../models/Supplier");

// GET /api/suppliers
const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: suppliers.length,
      data: suppliers,
    });
  } catch (error) {
    console.error("Get suppliers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch suppliers",
    });
  }
};

// GET /api/suppliers/:id
const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(
      req.params.id
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    console.error("Get supplier error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch supplier",
    });
  }
};

// POST /api/suppliers
const createSupplier = async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      phone,
      email,
      address,
      city,
      company,
      notes,
      status,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Supplier name is required",
      });
    }

    if (!phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const supplier = await Supplier.create({
      name,
      contactPerson,
      phone,
      email,
      address,
      city,
      company,
      notes,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier,
    });
  } catch (error) {
    console.error("Create supplier error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(
        error.errors
      ).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create supplier",
    });
  }
};

// PUT /api/suppliers/:id
const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(
      req.params.id
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    const {
      name,
      contactPerson,
      phone,
      email,
      address,
      city,
      company,
      notes,
      status,
    } = req.body;

    if (name !== undefined) {
      supplier.name = name;
    }

    if (contactPerson !== undefined) {
      supplier.contactPerson = contactPerson;
    }

    if (phone !== undefined) {
      supplier.phone = phone;
    }

    if (email !== undefined) {
      supplier.email = email;
    }

    if (address !== undefined) {
      supplier.address = address;
    }

    if (city !== undefined) {
      supplier.city = city;
    }

    if (company !== undefined) {
      supplier.company = company;
    }

    if (notes !== undefined) {
      supplier.notes = notes;
    }

    if (status !== undefined) {
      supplier.status = status;
    }

    await supplier.save();

    res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier,
    });
  } catch (error) {
    console.error("Update supplier error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(
        error.errors
      ).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update supplier",
    });
  }
};

// DELETE /api/suppliers/:id
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(
      req.params.id
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    await supplier.deleteOne();

    res.status(200).json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error("Delete supplier error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete supplier",
    });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};