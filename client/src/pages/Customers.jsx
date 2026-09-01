import { useEffect, useState } from "react";

import {
  Users,
  UserPlus,
  Search,
  Pencil,
  Trash2,
  X,
  Phone,
  Mail,
  History,
  ShoppingBag,
  Wallet,
  CalendarDays,
  Eye,
} from "lucide-react";

import {
  getCustomers,
  getCustomerHistory,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../services/customerService";


const initialForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  notes: "",
  status: "active",
};


function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState(null);

  const [form, setForm] =
    useState(initialForm);


  // Purchase history state
  const [showHistoryModal, setShowHistoryModal] =
    useState(false);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [historyError, setHistoryError] =
    useState("");

  const [customerHistory, setCustomerHistory] =
    useState(null);


  let currentUser = null;

  try {
    currentUser = JSON.parse(
      localStorage.getItem("erp_user") || "{}"
    );
  } catch {
    currentUser = {};
  }


  const canEditCustomer =
    currentUser?.role === "admin" ||
    currentUser?.role === "manager";

  const canDeleteCustomer =
    currentUser?.role === "admin";


  // =========================
  // LOAD CUSTOMERS
  // =========================

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const result =
        await getCustomers();

      setCustomers(
        result.data || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load customers."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadCustomers();
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

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // =========================
  // ADD CUSTOMER MODAL
  // =========================

  const openAddModal = () => {
    setEditingCustomer(null);
    setForm(initialForm);
    setError("");
    setShowModal(true);
  };


  // =========================
  // EDIT CUSTOMER MODAL
  // =========================

  const openEditModal = (
    customer
  ) => {
    setEditingCustomer(customer);

    setForm({
      name:
        customer.name || "",
      phone:
        customer.phone || "",
      email:
        customer.email || "",
      address:
        customer.address || "",
      city:
        customer.city || "",
      notes:
        customer.notes || "",
      status:
        customer.status ||
        "active",
    });

    setError("");
    setShowModal(true);
  };


  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setForm(initialForm);
    setError("");
  };


  // =========================
  // SAVE CUSTOMER
  // =========================

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      try {
        setSaving(true);
        setError("");

        if (
          editingCustomer
        ) {
          await updateCustomer(
            editingCustomer._id,
            form
          );

          showSuccess(
            "Customer updated successfully"
          );
        } else {
          await createCustomer(
            form
          );

          showSuccess(
            "Customer created successfully"
          );
        }

        closeModal();

        await loadCustomers();

      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to save customer."
        );
      } finally {
        setSaving(false);
      }
    };


  // =========================
  // DELETE CUSTOMER
  // =========================

  const handleDelete =
    async (customer) => {
      const confirmed =
        window.confirm(
          `Are you sure you want to delete ${customer.name}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");

        await deleteCustomer(
          customer._id
        );

        showSuccess(
          "Customer deleted successfully"
        );

        await loadCustomers();

      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to delete customer."
        );
      }
    };


  // =========================
  // CUSTOMER HISTORY
  // =========================

  const openHistoryModal =
    async (customer) => {
      try {
        setShowHistoryModal(
          true
        );

        setHistoryLoading(
          true
        );

        setHistoryError("");

        setCustomerHistory(
          null
        );


        const result =
          await getCustomerHistory(
            customer._id
          );


        setCustomerHistory(
          result.data
        );

      } catch (err) {
        setHistoryError(
          err.response?.data?.message ||
            "Unable to load customer purchase history."
        );
      } finally {
        setHistoryLoading(
          false
        );
      }
    };


  const closeHistoryModal =
    () => {
      setShowHistoryModal(
        false
      );

      setCustomerHistory(
        null
      );

      setHistoryError("");
    };


  // =========================
  // SEARCH
  // =========================

  const filteredCustomers =
    customers.filter(
      (customer) => {

        const text =
          search
            .toLowerCase()
            .trim();

        return (
          customer.name
            ?.toLowerCase()
            .includes(text) ||

          customer.phone
            ?.toLowerCase()
            .includes(text) ||

          customer.email
            ?.toLowerCase()
            .includes(text) ||

          customer.city
            ?.toLowerCase()
            .includes(text)
        );
      }
    );


  return (
    <div className="customers-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="page-header">

        <div>

          <h1>
            <Users size={28} />
            Customers
          </h1>

          <p>
            Manage customer profiles,
            contact information and
            purchase history.
          </p>

        </div>


        <button
          type="button"
          className="primary-btn"
          onClick={
            openAddModal
          }
        >
          <UserPlus size={18} />
          Add Customer
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

      <div className="customers-summary-grid">

        <div className="summary-card">

          <span>
            Total Customers
          </span>

          <strong>
            {customers.length}
          </strong>

        </div>


        <div className="summary-card">

          <span>
            Active Customers
          </span>

          <strong>
            {
              customers.filter(
                (customer) =>
                  customer.status ===
                  "active"
              ).length
            }
          </strong>

        </div>


        <div className="summary-card">

          <span>
            Inactive Customers
          </span>

          <strong>
            {
              customers.filter(
                (customer) =>
                  customer.status ===
                  "inactive"
              ).length
            }
          </strong>

        </div>

      </div>


      {/* =========================
          CUSTOMER TABLE
      ========================= */}

      <div className="table-card">

        <div className="table-toolbar">

          <div className="search-box">

            <Search size={18} />

            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={
                (e) =>
                  setSearch(
                    e.target.value
                  )
              }
            />

          </div>

        </div>


        {loading ? (

          <div className="table-loading">
            Loading customers...
          </div>

        ) : (

          <div className="table-responsive">

            <table className="erp-table">

              <thead>

                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>

              </thead>


              <tbody>

                {filteredCustomers.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="empty-table"
                    >
                      No customers found.
                    </td>

                  </tr>

                ) : (

                  filteredCustomers.map(
                    (customer) => (

                      <tr
                        key={
                          customer._id
                        }
                      >

                        <td>
                          <strong>
                            {
                              customer.name
                            }
                          </strong>
                        </td>


                        <td>

                          <div className="customer-contact">

                            <Phone
                              size={14}
                            />

                            {customer.phone ||
                              "-"}

                          </div>

                        </td>


                        <td>

                          <div className="customer-contact">

                            <Mail
                              size={14}
                            />

                            {customer.email ||
                              "-"}

                          </div>

                        </td>


                        <td>
                          {customer.city ||
                            "-"}
                        </td>


                        <td>

                          <span
                            className={`status-badge ${
                              customer.status ===
                              "active"
                                ? "status-active"
                                : "status-inactive"
                            }`}
                          >
                            {
                              customer.status
                            }
                          </span>

                        </td>


                        <td>

                          {customer.createdAt
                            ? new Date(
                                customer.createdAt
                              ).toLocaleDateString()
                            : "-"}

                        </td>


                        <td>

                          <div className="table-actions">


                            {/* Purchase History */}

                            <button
                              type="button"
                              className="icon-btn history-icon"
                              title="View Purchase History"
                              onClick={() =>
                                openHistoryModal(
                                  customer
                                )
                              }
                            >
                              <Eye
                                size={16}
                              />
                            </button>


                            {/* Edit */}

                            {canEditCustomer && (

                              <button
                                type="button"
                                className="icon-btn"
                                title="Edit Customer"
                                onClick={() =>
                                  openEditModal(
                                    customer
                                  )
                                }
                              >
                                <Pencil
                                  size={16}
                                />
                              </button>

                            )}


                            {/* Delete */}

                            {canDeleteCustomer && (

                              <button
                                type="button"
                                className="icon-btn danger-icon"
                                title="Delete Customer"
                                onClick={() =>
                                  handleDelete(
                                    customer
                                  )
                                }
                              >
                                <Trash2
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
          ADD / EDIT CUSTOMER MODAL
      ========================= */}

      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={
            closeModal
          }
        >

          <div
            className="modal-container customer-modal"
            onMouseDown={
              (e) =>
                e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  {editingCustomer
                    ? "Edit Customer"
                    : "Add Customer"}
                </h2>

                <p>
                  {editingCustomer
                    ? "Update customer information"
                    : "Create a new customer profile"}
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={
                  closeModal
                }
              >
                <X size={20} />
              </button>

            </div>


            <form
              onSubmit={
                handleSubmit
              }
              className="erp-form"
            >

              <div className="form-group">

                <label>
                  Customer Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter customer name"
                  required
                />

              </div>


              <div className="form-row">


                <div className="form-group">

                  <label>
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="03001234567"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      form.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="customer@example.com"
                  />

                </div>

              </div>


              <div className="form-row">


                <div className="form-group">

                  <label>
                    City
                  </label>

                  <input
                    type="text"
                    name="city"
                    value={
                      form.city
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="City"
                  />

                </div>


                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      form.status
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>

                  </select>

                </div>

              </div>


              <div className="form-group">

                <label>
                  Address
                </label>

                <input
                  type="text"
                  name="address"
                  value={
                    form.address
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Customer address"
                />

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
                  placeholder="Optional notes"
                  rows="3"
                />

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={
                    closeModal
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
                    : editingCustomer
                    ? "Update Customer"
                    : "Create Customer"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =========================
          PURCHASE HISTORY MODAL
      ========================= */}

      {showHistoryModal && (

        <div
          className="modal-overlay"
          onMouseDown={
            closeHistoryModal
          }
        >

          <div
            className="modal-container customer-history-modal"
            onMouseDown={
              (e) =>
                e.stopPropagation()
            }
          >

            {/* Header */}

            <div className="modal-header">

              <div>

                <h2>
                  <History
                    size={21}
                  />
                  Purchase History
                </h2>

                <p>
                  Customer sales and
                  spending information
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={
                  closeHistoryModal
                }
              >
                <X size={20} />
              </button>

            </div>


            {/* Loading */}

            {historyLoading && (

              <div className="history-loading">
                Loading purchase history...
              </div>

            )}


            {/* Error */}

            {!historyLoading &&
              historyError && (

                <div className="error-message">
                  {historyError}
                </div>

              )}


            {/* History Content */}

            {!historyLoading &&
              !historyError &&
              customerHistory && (

                <div className="customer-history-content">


                  {/* Customer Details */}

                  <div className="history-customer-header">

                    <div>

                      <h3>
                        {
                          customerHistory
                            .customer
                            .name
                        }
                      </h3>

                      <p>
                        {customerHistory
                          .customer
                          .phone ||
                          "No phone"}
                        {" • "}
                        {customerHistory
                          .customer
                          .email ||
                          "No email"}
                      </p>

                    </div>


                    <span
                      className={`status-badge ${
                        customerHistory
                          .customer
                          .status ===
                        "active"
                          ? "status-active"
                          : "status-inactive"
                      }`}
                    >
                      {
                        customerHistory
                          .customer
                          .status
                      }
                    </span>

                  </div>


                  {/* Stats */}

                  <div className="customer-history-stats">

                    <div className="history-stat-card">

                      <ShoppingBag
                        size={20}
                      />

                      <div>

                        <span>
                          Total Purchases
                        </span>

                        <strong>
                          {
                            customerHistory
                              .stats
                              .totalPurchases
                          }
                        </strong>

                      </div>

                    </div>


                    <div className="history-stat-card">

                      <Wallet
                        size={20}
                      />

                      <div>

                        <span>
                          Total Spent
                        </span>

                        <strong>
                          Rs.{" "}
                          {Number(
                            customerHistory
                              .stats
                              .totalSpent ||
                              0
                          ).toLocaleString()}
                        </strong>

                      </div>

                    </div>


                    <div className="history-stat-card">

                      <CalendarDays
                        size={20}
                      />

                      <div>

                        <span>
                          Last Purchase
                        </span>

                        <strong>

                          {customerHistory
                            .stats
                            .lastPurchase
                            ? new Date(
                                customerHistory
                                  .stats
                                  .lastPurchase
                              ).toLocaleDateString()
                            : "No purchases"}

                        </strong>

                      </div>

                    </div>

                  </div>


                  {/* Sales Table */}

                  <div className="history-sales-section">

                    <h3>
                      Sales
                    </h3>


                    {customerHistory
                      .sales
                      .length === 0 ? (

                      <div className="history-empty">

                        <ShoppingBag
                          size={34}
                        />

                        <p>
                          No purchases found
                          for this customer.
                        </p>

                      </div>

                    ) : (

                      <div className="table-responsive">

                        <table className="erp-table history-table">

                          <thead>

                            <tr>
                              <th>
                                Sale #
                              </th>

                              <th>
                                Products
                              </th>

                              <th>
                                Total
                              </th>

                              <th>
                                Payment
                              </th>

                              <th>
                                Date
                              </th>
                            </tr>

                          </thead>


                          <tbody>

                            {customerHistory
                              .sales
                              .map(
                                (sale) => (

                                  <tr
                                    key={
                                      sale._id
                                    }
                                  >

                                    <td>

                                      <strong>
                                        {
                                          sale.saleNumber
                                        }
                                      </strong>

                                    </td>


                                    <td>

                                      {sale.items
                                        ?.map(
                                          (
                                            item
                                          ) =>
                                            `${item.productName} × ${item.quantity}`
                                        )
                                        .join(
                                          ", "
                                        )}

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
                                      {
                                        sale.paymentMethod
                                      }
                                    </td>


                                    <td>

                                      {new Date(
                                        sale.saleDate
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

                </div>

              )}

          </div>

        </div>

      )}

    </div>
  );
}


export default Customers;