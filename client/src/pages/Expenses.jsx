import { useEffect, useMemo, useState } from "react";

import {
  WalletCards,
  Plus,
  Search,
  Pencil,
  X,
  Ban,
  Banknote,
  CreditCard,
  ReceiptText,
} from "lucide-react";

import {
  getExpenses,
  createExpense,
  updateExpense,
  cancelExpense,
} from "../services/expenseService";


const initialForm = {
  title: "",
  category: "other",
  amount: "",
  expenseDate:
    new Date()
      .toISOString()
      .split("T")[0],
  paymentMethod: "cash",
  vendor: "",
  reference: "",
  notes: "",
};


function Expenses() {
  const [expenses, setExpenses] = useState([]);

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingExpense, setEditingExpense] =
    useState(null);

  const [form, setForm] =
    useState(initialForm);


  // =========================
  // LOAD EXPENSES
  // =========================

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError("");

      const result =
        await getExpenses();

      setExpenses(
        result.data || []
      );

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load expenses."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadExpenses();
  }, []);


  // =========================
  // SUCCESS MESSAGE
  // =========================

  const showSuccess = (text) => {
    setMessage(text);
    setError("");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };


  // =========================
  // FORM CHANGE
  // =========================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };


  // =========================
  // ADD MODAL
  // =========================

  const openAddModal = () => {
    setEditingExpense(null);

    setForm({
      ...initialForm,
      expenseDate:
        new Date()
          .toISOString()
          .split("T")[0],
    });

    setError("");
    setShowModal(true);
  };


  // =========================
  // EDIT MODAL
  // =========================

  const openEditModal = (expense) => {
    setEditingExpense(expense);

    setForm({
      title:
        expense.title || "",

      category:
        expense.category ||
        "other",

      amount:
        expense.amount || "",

      expenseDate:
        expense.expenseDate
          ? new Date(
              expense.expenseDate
            )
              .toISOString()
              .split("T")[0]
          : "",

      paymentMethod:
        expense.paymentMethod ||
        "cash",

      vendor:
        expense.vendor || "",

      reference:
        expense.reference || "",

      notes:
        expense.notes || "",
    });

    setError("");
    setShowModal(true);
  };


  // =========================
  // CLOSE MODAL
  // =========================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingExpense(null);
    setForm(initialForm);
    setError("");
  };


  // =========================
  // SAVE EXPENSE
  // =========================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setError("");


      const amount =
        Number(form.amount);


      if (!form.title.trim()) {
        setError(
          "Expense title is required."
        );

        return;
      }


      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        setError(
          "Expense amount must be greater than 0."
        );

        return;
      }


      try {
        setSaving(true);


        const payload = {
          title:
            form.title.trim(),

          category:
            form.category,

          amount,

          expenseDate:
            form.expenseDate,

          paymentMethod:
            form.paymentMethod,

          vendor:
            form.vendor.trim(),

          reference:
            form.reference.trim(),

          notes:
            form.notes.trim(),
        };


        if (editingExpense) {

          await updateExpense(
            editingExpense._id,
            payload
          );

          showSuccess(
            "Expense updated successfully"
          );

        } else {

          await createExpense(
            payload
          );

          showSuccess(
            "Expense created successfully"
          );
        }


        closeModal();

        await loadExpenses();

      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.message ||
            "Unable to save expense."
        );

      } finally {
        setSaving(false);
      }
    };


  // =========================
  // CANCEL EXPENSE
  // =========================

  const handleCancelExpense =
    async (expense) => {

      const confirmed =
        window.confirm(
          `Cancel expense "${expense.title}"?`
        );


      if (!confirmed) {
        return;
      }


      try {
        setError("");

        await cancelExpense(
          expense._id
        );

        showSuccess(
          "Expense cancelled successfully"
        );

        await loadExpenses();

      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.message ||
            "Unable to cancel expense."
        );
      }
    };


  // =========================
  // SUMMARY
  // =========================

  const activeExpenses =
    expenses.filter(
      (expense) =>
        expense.status ===
        "active"
    );


  const totalActiveExpense =
    activeExpenses.reduce(
      (total, expense) =>
        total +
        Number(
          expense.amount || 0
        ),
      0
    );


  const currentMonth =
    new Date().getMonth();

  const currentYear =
    new Date().getFullYear();


  const monthlyExpense =
    activeExpenses.reduce(
      (total, expense) => {

        const date =
          new Date(
            expense.expenseDate
          );


        if (
          date.getMonth() ===
            currentMonth &&
          date.getFullYear() ===
            currentYear
        ) {
          return (
            total +
            Number(
              expense.amount ||
                0
            )
          );
        }


        return total;
      },
      0
    );


  const topCategory =
    useMemo(() => {

      const totals = {};


      activeExpenses.forEach(
        (expense) => {

          const category =
            expense.category ||
            "other";


          totals[category] =
            (
              totals[category] ||
              0
            ) +
            Number(
              expense.amount ||
                0
            );
        }
      );


      const entries =
        Object.entries(
          totals
        );


      if (
        entries.length === 0
      ) {
        return "-";
      }


      entries.sort(
        (a, b) =>
          b[1] - a[1]
      );


      return entries[0][0];

    }, [activeExpenses]);


  // =========================
  // FILTERS
  // =========================

  const filteredExpenses =
    expenses.filter(
      (expense) => {

        const text =
          search
            .toLowerCase()
            .trim();


        const matchesSearch =
          expense.expenseNumber
            ?.toLowerCase()
            .includes(text) ||

          expense.title
            ?.toLowerCase()
            .includes(text) ||

          expense.vendor
            ?.toLowerCase()
            .includes(text) ||

          expense.reference
            ?.toLowerCase()
            .includes(text);


        const matchesCategory =
          categoryFilter ===
            "all" ||
          expense.category ===
            categoryFilter;


        const matchesStatus =
          statusFilter === "all" ||
          expense.status ===
            statusFilter;


        return (
          matchesSearch &&
          matchesCategory &&
          matchesStatus
        );
      }
    );


  return (
    <div className="expenses-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="page-header">

        <div>

          <h1>
            <WalletCards
              size={28}
            />

            Expenses
          </h1>

          <p>
            Record and manage store
            operating expenses.
          </p>

        </div>


        <button
          type="button"
          className="primary-btn"
          onClick={
            openAddModal
          }
        >
          <Plus size={18} />
          Add Expense
        </button>

      </div>


      {/* =========================
          MESSAGES
      ========================= */}

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}


      {/* =========================
          SUMMARY
      ========================= */}

      <div className="expenses-summary-grid">

        <div className="summary-card">

          <span>
            Active Expenses
          </span>

          <strong>
            {
              activeExpenses.length
            }
          </strong>

        </div>


        <div className="summary-card">

          <span>
            Total Expense
          </span>

          <strong>
            Rs.{" "}
            {totalActiveExpense.toLocaleString()}
          </strong>

        </div>


        <div className="summary-card">

          <span>
            This Month
          </span>

          <strong>
            Rs.{" "}
            {monthlyExpense.toLocaleString()}
          </strong>

        </div>


        <div className="summary-card">

          <span>
            Top Category
          </span>

          <strong className="expense-category-name">
            {topCategory === "-"
              ? "-"
              : topCategory.replace(
                  "_",
                  " "
                )}
          </strong>

        </div>

      </div>


      {/* =========================
          TABLE CARD
      ========================= */}

      <div className="table-card">

        <div className="expense-toolbar">

          <div className="search-box">

            <Search
              size={18}
            />

            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={
                (event) =>
                  setSearch(
                    event.target
                      .value
                  )
              }
            />

          </div>


          <select
            className="expense-filter"
            value={
              categoryFilter
            }
            onChange={
              (event) =>
                setCategoryFilter(
                  event.target
                    .value
                )
            }
          >

            <option value="all">
              All Categories
            </option>

            <option value="rent">
              Rent
            </option>

            <option value="electricity">
              Electricity
            </option>

            <option value="salary">
              Salary
            </option>

            <option value="transport">
              Transport
            </option>

            <option value="maintenance">
              Maintenance
            </option>

            <option value="marketing">
              Marketing
            </option>

            <option value="utilities">
              Utilities
            </option>

            <option value="supplies">
              Supplies
            </option>

            <option value="tax">
              Tax
            </option>

            <option value="other">
              Other
            </option>

          </select>


          <select
            className="expense-filter"
            value={
              statusFilter
            }
            onChange={
              (event) =>
                setStatusFilter(
                  event.target
                    .value
                )
            }
          >

            <option value="all">
              All Statuses
            </option>

            <option value="active">
              Active
            </option>

            <option value="cancelled">
              Cancelled
            </option>

          </select>


          <div className="sale-count">

            <ReceiptText
              size={18}
            />

            {filteredExpenses.length}
            {" "}
            Expenses

          </div>

        </div>


        {/* Loading */}

        {loading ? (

          <div className="table-loading">
            Loading expenses...
          </div>

        ) : (

          <div className="table-responsive">

            <table className="erp-table">

              <thead>

                <tr>
                  <th>
                    Expense #
                  </th>

                  <th>
                    Title
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Payment
                  </th>

                  <th>
                    Vendor
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Recorded By
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>

              </thead>


              <tbody>

                {filteredExpenses.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan="10"
                      className="empty-table"
                    >
                      No expenses found.
                    </td>

                  </tr>

                ) : (

                  filteredExpenses.map(
                    (expense) => (

                      <tr
                        key={
                          expense._id
                        }
                      >

                        <td>

                          <span className="sale-number">
                            {
                              expense.expenseNumber
                            }
                          </span>

                        </td>


                        <td>

                          <strong>
                            {
                              expense.title
                            }
                          </strong>

                          {expense.reference && (

                            <div className="expense-reference">
                              Ref:{" "}
                              {
                                expense.reference
                              }
                            </div>

                          )}

                        </td>


                        <td>

                          <span className="expense-category-badge">
                            {
                              expense.category
                            }
                          </span>

                        </td>


                        <td>

                          <strong>
                            Rs.{" "}
                            {Number(
                              expense.amount ||
                                0
                            ).toLocaleString()}
                          </strong>

                        </td>


                        <td>

                          <span className="payment-method">

                            {expense.paymentMethod ===
                            "cash" ? (

                              <Banknote
                                size={14}
                              />

                            ) : (

                              <CreditCard
                                size={14}
                              />

                            )}

                            {
                              expense.paymentMethod
                            }

                          </span>

                        </td>


                        <td>
                          {expense.vendor ||
                            "-"}
                        </td>


                        <td>

                          {expense.expenseDate
                            ? new Date(
                                expense.expenseDate
                              ).toLocaleDateString()
                            : "-"}

                        </td>


                        <td>

                          {expense.recordedBy
                            ?.name ||
                            "-"}

                        </td>


                        <td>

                          <span
                            className={`status-badge ${
                              expense.status ===
                              "active"
                                ? "status-active"
                                : "status-inactive"
                            }`}
                          >
                            {
                              expense.status
                            }
                          </span>

                        </td>


                        <td>

                          <div className="table-actions">


                            {expense.status ===
                              "active" && (

                              <button
                                type="button"
                                className="icon-btn"
                                title="Edit Expense"
                                onClick={() =>
                                  openEditModal(
                                    expense
                                  )
                                }
                              >
                                <Pencil
                                  size={16}
                                />
                              </button>

                            )}


                            {expense.status ===
                              "active" && (

                              <button
                                type="button"
                                className="icon-btn danger-icon"
                                title="Cancel Expense"
                                onClick={() =>
                                  handleCancelExpense(
                                    expense
                                  )
                                }
                              >
                                <Ban
                                  size={16}
                                />
                              </button>

                            )}

                          </div>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =========================
          ADD / EDIT MODAL
      ========================= */}

      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={
            closeModal
          }
        >

          <div
            className="modal-container expense-modal"
            onMouseDown={
              (event) =>
                event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  {editingExpense
                    ? "Edit Expense"
                    : "Add Expense"}
                </h2>

                <p>
                  {editingExpense
                    ? "Update expense information"
                    : "Record a new business expense"}
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
              >
                <X size={20} />
              </button>

            </div>


            <form
              className="erp-form"
              onSubmit={
                handleSubmit
              }
            >

              <div className="form-group">

                <label>
                  Expense Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={
                    form.title
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. September Electricity Bill"
                  required
                />

              </div>


              <div className="form-row">


                <div className="form-group">

                  <label>
                    Category
                  </label>

                  <select
                    name="category"
                    value={
                      form.category
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="rent">
                      Rent
                    </option>

                    <option value="electricity">
                      Electricity
                    </option>

                    <option value="salary">
                      Salary
                    </option>

                    <option value="transport">
                      Transport
                    </option>

                    <option value="maintenance">
                      Maintenance
                    </option>

                    <option value="marketing">
                      Marketing
                    </option>

                    <option value="utilities">
                      Utilities
                    </option>

                    <option value="supplies">
                      Supplies
                    </option>

                    <option value="tax">
                      Tax
                    </option>

                    <option value="other">
                      Other
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Amount (Rs.)
                  </label>

                  <input
                    type="number"
                    name="amount"
                    value={
                      form.amount
                    }
                    onChange={
                      handleChange
                    }
                    min="0.01"
                    step="0.01"
                    placeholder="0"
                    required
                  />

                </div>

              </div>


              <div className="form-row">


                <div className="form-group">

                  <label>
                    Expense Date
                  </label>

                  <input
                    type="date"
                    name="expenseDate"
                    value={
                      form.expenseDate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Payment Method
                  </label>

                  <select
                    name="paymentMethod"
                    value={
                      form.paymentMethod
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="cash">
                      Cash
                    </option>

                    <option value="card">
                      Card
                    </option>

                    <option value="bank">
                      Bank Transfer
                    </option>

                    <option value="other">
                      Other
                    </option>

                  </select>

                </div>

              </div>


              <div className="form-row">


                <div className="form-group">

                  <label>
                    Vendor / Payee
                  </label>

                  <input
                    type="text"
                    name="vendor"
                    value={
                      form.vendor
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="e.g. IESCO"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Reference
                  </label>

                  <input
                    type="text"
                    name="reference"
                    value={
                      form.reference
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Bill / invoice reference"
                  />

                </div>

              </div>


              <div className="form-group">

                <label>
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={
                    form.notes
                  }
                  onChange={
                    handleChange
                  }
                  rows="3"
                  placeholder="Optional expense notes..."
                />

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-btn"
                  disabled={
                    saving
                  }
                >

                  {saving
                    ? "Saving..."
                    : editingExpense
                    ? "Update Expense"
                    : "Add Expense"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


export default Expenses;