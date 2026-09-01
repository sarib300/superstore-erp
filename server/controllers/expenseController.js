const Expense = require("../models/Expense");


const generateExpenseNumber = () => {
  return `EXP-${Date.now()}`;
};


// GET ALL EXPENSES
const getExpenses = async (req, res) => {
  try {
    const expenses =
      await Expense.find()
        .populate(
          "recordedBy",
          "name email role"
        )
        .sort({
          expenseDate: -1,
          createdAt: -1,
        });


    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });

  } catch (error) {
    console.error(
      "Get expenses error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch expenses",
    });
  }
};


// GET SINGLE EXPENSE
const getExpenseById = async (req, res) => {
  try {
    const expense =
      await Expense.findById(
        req.params.id
      ).populate(
        "recordedBy",
        "name email role"
      );


    if (!expense) {
      return res.status(404).json({
        success: false,
        message:
          "Expense not found",
      });
    }


    res.status(200).json({
      success: true,
      data: expense,
    });

  } catch (error) {
    console.error(
      "Get expense error:",
      error
    );


    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid expense ID",
      });
    }


    res.status(500).json({
      success: false,
      message:
        "Failed to fetch expense",
    });
  }
};


// CREATE EXPENSE
const createExpense = async (req, res) => {
  try {
    const {
      title,
      category,
      amount,
      expenseDate,
      paymentMethod,
      vendor,
      reference,
      notes,
    } = req.body;


    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Expense title is required",
      });
    }


    const validCategories = [
      "rent",
      "electricity",
      "salary",
      "transport",
      "maintenance",
      "marketing",
      "utilities",
      "supplies",
      "tax",
      "other",
    ];


    if (
      !validCategories.includes(
        category
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid expense category",
      });
    }


    const expenseAmount =
      Number(amount);


    if (
      !Number.isFinite(
        expenseAmount
      ) ||
      expenseAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Expense amount must be greater than 0",
      });
    }


    const expense =
      await Expense.create({
        expenseNumber:
          generateExpenseNumber(),

        title:
          title.trim(),

        category,

        amount:
          expenseAmount,

        expenseDate:
          expenseDate ||
          new Date(),

        paymentMethod:
          paymentMethod ||
          "cash",

        vendor:
          vendor?.trim() ||
          "",

        reference:
          reference?.trim() ||
          "",

        notes:
          notes?.trim() ||
          "",

        recordedBy:
          req.user?._id ||
          null,

        status:
          "active",
      });


    const populatedExpense =
      await Expense.findById(
        expense._id
      ).populate(
        "recordedBy",
        "name email role"
      );


    res.status(201).json({
      success: true,
      message:
        "Expense created successfully",
      data:
        populatedExpense,
    });

  } catch (error) {
    console.error(
      "Create expense error:",
      error
    );


    if (
      error.name ===
      "ValidationError"
    ) {
      const messages =
        Object.values(
          error.errors
        ).map(
          (err) =>
            err.message
        );


      return res.status(400).json({
        success: false,
        message:
          messages.join(", "),
      });
    }


    if (
      error.code ===
      11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Duplicate expense number. Please try again.",
      });
    }


    res.status(500).json({
      success: false,
      message:
        "Failed to create expense",
    });
  }
};


// UPDATE EXPENSE
const updateExpense = async (req, res) => {
  try {
    const expense =
      await Expense.findById(
        req.params.id
      );


    if (!expense) {
      return res.status(404).json({
        success: false,
        message:
          "Expense not found",
      });
    }


    const {
      title,
      category,
      amount,
      expenseDate,
      paymentMethod,
      vendor,
      reference,
      notes,
      status,
    } = req.body;


    if (
      title !== undefined
    ) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Expense title is required",
        });
      }

      expense.title =
        title.trim();
    }


    if (
      category !== undefined
    ) {
      const validCategories = [
        "rent",
        "electricity",
        "salary",
        "transport",
        "maintenance",
        "marketing",
        "utilities",
        "supplies",
        "tax",
        "other",
      ];


      if (
        !validCategories.includes(
          category
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid expense category",
        });
      }


      expense.category =
        category;
    }


    if (
      amount !== undefined
    ) {
      const expenseAmount =
        Number(amount);


      if (
        !Number.isFinite(
          expenseAmount
        ) ||
        expenseAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Expense amount must be greater than 0",
        });
      }


      expense.amount =
        expenseAmount;
    }


    if (
      expenseDate !== undefined
    ) {
      expense.expenseDate =
        expenseDate;
    }


    if (
      paymentMethod !== undefined
    ) {
      if (
        ![
          "cash",
          "card",
          "bank",
          "other",
        ].includes(
          paymentMethod
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid payment method",
        });
      }

      expense.paymentMethod =
        paymentMethod;
    }


    if (
      vendor !== undefined
    ) {
      expense.vendor =
        vendor.trim();
    }


    if (
      reference !== undefined
    ) {
      expense.reference =
        reference.trim();
    }


    if (
      notes !== undefined
    ) {
      expense.notes =
        notes.trim();
    }


    if (
      status !== undefined
    ) {
      if (
        ![
          "active",
          "cancelled",
        ].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid expense status",
        });
      }

      expense.status =
        status;
    }


    await expense.save();


    const populatedExpense =
      await Expense.findById(
        expense._id
      ).populate(
        "recordedBy",
        "name email role"
      );


    res.status(200).json({
      success: true,
      message:
        "Expense updated successfully",
      data:
        populatedExpense,
    });

  } catch (error) {
    console.error(
      "Update expense error:",
      error
    );


    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid expense ID",
      });
    }


    res.status(500).json({
      success: false,
      message:
        "Failed to update expense",
    });
  }
};


// CANCEL EXPENSE
const cancelExpense = async (req, res) => {
  try {
    const expense =
      await Expense.findById(
        req.params.id
      );


    if (!expense) {
      return res.status(404).json({
        success: false,
        message:
          "Expense not found",
      });
    }


    if (
      expense.status ===
      "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Expense is already cancelled",
      });
    }


    expense.status =
      "cancelled";

    await expense.save();


    res.status(200).json({
      success: true,
      message:
        "Expense cancelled successfully",
      data: expense,
    });

  } catch (error) {
    console.error(
      "Cancel expense error:",
      error
    );


    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid expense ID",
      });
    }


    res.status(500).json({
      success: false,
      message:
        "Failed to cancel expense",
    });
  }
};


module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  cancelExpense,
};