import { useEffect, useState } from "react";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Truck,
  Phone,
  Mail,
  X,
} from "lucide-react";

import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../services/supplierService";

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] =
    useState(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    company: "",
    notes: "",
    status: "active",
  });

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getSuppliers();

      setSuppliers(result.data || []);
    } catch (error) {
      console.error(error);

      setError("Unable to load suppliers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Form field change
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  // Open Add Supplier modal
  const handleOpenModal = () => {
    setEditingSupplier(null);
    setFormError("");

    setFormData({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      company: "",
      notes: "",
      status: "active",
    });

    setShowModal(true);
  };

  // Open Edit Supplier modal
  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormError("");

    setFormData({
      name: supplier.name || "",
      contactPerson: supplier.contactPerson || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      city: supplier.city || "",
      company: supplier.company || "",
      notes: supplier.notes || "",
      status: supplier.status || "active",
    });

    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingSupplier(null);
    setFormError("");
  };

  // Add / Edit Supplier
  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Supplier name is required.");
      return;
    }

    if (!formData.phone.trim()) {
      setFormError("Phone number is required.");
      return;
    }

    if (
      formData.email &&
      !formData.email.includes("@")
    ) {
      setFormError("Enter a valid email address.");
      return;
    }

    try {
      setSaving(true);

      const supplierData = {
        name: formData.name.trim(),
        contactPerson:
          formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        company: formData.company.trim(),
        notes: formData.notes.trim(),
        status: formData.status,
      };

      if (editingSupplier) {
        const result = await updateSupplier(
          editingSupplier._id,
          supplierData
        );

        setSuppliers((currentSuppliers) =>
          currentSuppliers.map((supplier) =>
            supplier._id === editingSupplier._id
              ? result.data
              : supplier
          )
        );
      } else {
        const result = await createSupplier(
          supplierData
        );

        setSuppliers((currentSuppliers) => [
          result.data,
          ...currentSuppliers,
        ]);
      }

      setShowModal(false);
      setEditingSupplier(null);

      setFormData({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        company: "",
        notes: "",
        status: "active",
      });
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.message ||
        (editingSupplier
          ? "Failed to update supplier."
          : "Failed to create supplier.");

      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Supplier
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this supplier?"
    );

    if (!confirmed) return;

    try {
      await deleteSupplier(id);

      setSuppliers((currentSuppliers) =>
        currentSuppliers.filter(
          (supplier) => supplier._id !== id
        )
      );
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.message ||
        "Failed to delete supplier.";

      alert(message);
    }
  };

  // Search
  const filteredSuppliers = suppliers.filter(
    (supplier) => {
      const searchValue = search
        .toLowerCase()
        .trim();

      const name =
        supplier.name?.toLowerCase() || "";

      const company =
        supplier.company?.toLowerCase() || "";

      const contactPerson =
        supplier.contactPerson?.toLowerCase() || "";

      const phone =
        supplier.phone?.toLowerCase() || "";

      const city =
        supplier.city?.toLowerCase() || "";

      return (
        name.includes(searchValue) ||
        company.includes(searchValue) ||
        contactPerson.includes(searchValue) ||
        phone.includes(searchValue) ||
        city.includes(searchValue)
      );
    }
  );

  return (
    <div className="suppliers-page">
      {/* Header */}
      <div className="suppliers-header">
        <div>
          <h1>Suppliers</h1>

          <p>
            Manage suppliers and distributor
            information.
          </p>
        </div>

        <button
          type="button"
          className="add-supplier-btn"
          onClick={handleOpenModal}
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      {/* Toolbar */}
      <div className="suppliers-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="supplier-count">
          <Truck size={18} />
          {suppliers.length} Suppliers
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="products-state">
          <p>Loading suppliers...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="products-state error-state">
          <p>{error}</p>

          <button
            type="button"
            onClick={fetchSuppliers}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading &&
        !error &&
        filteredSuppliers.length === 0 && (
          <div className="products-state empty-state">
            <Truck size={42} />

            <h3>
              {suppliers.length === 0
                ? "No suppliers yet"
                : "No suppliers found"}
            </h3>

            <p>
              {suppliers.length === 0
                ? "Add your first supplier to get started."
                : "Try changing your search."}
            </p>
          </div>
        )}

      {/* Table */}
      {!loading &&
        !error &&
        filteredSuppliers.length > 0 && (
          <div className="suppliers-table-container">
            <table className="suppliers-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.map(
                  (supplier) => (
                    <tr key={supplier._id}>
                      <td>
                        <div className="supplier-name">
                          <div className="supplier-icon">
                            <Truck size={18} />
                          </div>

                          <div>
                            <strong>
                              {supplier.name}
                            </strong>

                            {supplier.address && (
                              <small>
                                {supplier.address}
                              </small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        {supplier.company || "-"}
                      </td>

                      <td>
                        {supplier.contactPerson ||
                          "-"}
                      </td>

                      <td>
                        <div className="supplier-contact">
                          <Phone size={14} />
                          {supplier.phone}
                        </div>
                      </td>

                      <td>
                        {supplier.email ? (
                          <div className="supplier-contact">
                            <Mail size={14} />
                            {supplier.email}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td>
                        {supplier.city || "-"}
                      </td>

                      <td>
                        <span
                          className={`status ${
                            supplier.status ===
                            "active"
                              ? "status-active"
                              : "status-inactive"
                          }`}
                        >
                          {supplier.status}
                        </span>
                      </td>

                      <td>
                        <div className="product-actions">
                          <button
                            type="button"
                            title="Edit supplier"
                            className="icon-btn"
                            onClick={() =>
                              handleEdit(supplier)
                            }
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            title="Delete supplier"
                            className="icon-btn delete-btn"
                            onClick={() =>
                              handleDelete(
                                supplier._id
                              )
                            }
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={handleCloseModal}
        >
          <div
            className="product-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>
                  {editingSupplier
                    ? "Edit Supplier"
                    : "Add Supplier"}
                </h2>

                <p>
                  {editingSupplier
                    ? "Update supplier information."
                    : "Add a new supplier to your ERP."}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={handleCloseModal}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="product-form"
              onSubmit={handleSubmit}
            >
              {formError && (
                <div className="form-error">
                  {formError}
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Supplier Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={
                      handleInputChange
                    }
                    placeholder="e.g. Ali Distributors"
                  />
                </div>

                <div className="form-group">
                  <label>Company</label>

                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={
                      handleInputChange
                    }
                    placeholder="e.g. ABC Trading"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Contact Person
                  </label>

                  <input
                    type="text"
                    name="contactPerson"
                    value={
                      formData.contactPerson
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="e.g. Ahmed Khan"
                  />
                </div>

                <div className="form-group">
                  <label>Phone *</label>

                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={
                      handleInputChange
                    }
                    placeholder="e.g. 03001234567"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={
                      handleInputChange
                    }
                    placeholder="supplier@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>City</label>

                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={
                      handleInputChange
                    }
                    placeholder="e.g. Islamabad"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={
                      handleInputChange
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

              <div className="form-group full-width">
                <label>Address</label>

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Supplier address..."
                  rows="2"
                />
              </div>

              <div className="form-group full-width">
                <label>Notes</label>

                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Optional notes..."
                  rows="3"
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-product-btn"
                  disabled={saving}
                >
                  {saving
                    ? editingSupplier
                      ? "Updating..."
                      : "Saving..."
                    : editingSupplier
                      ? "Update Supplier"
                      : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suppliers;