import { useEffect, useState } from "react";

import {
  Plus,
  Search,
  ShoppingCart,
  X,
  Trash2,
  Package,
  Truck,
  ReceiptText,
} from "lucide-react";

import {
  getPurchases,
  createPurchase,
} from "../services/purchaseService";

import {
  getProducts,
} from "../services/productService";

import {
  getSuppliers,
} from "../services/supplierService";

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    supplier: "",
    invoiceNumber: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [items, setItems] = useState([
    {
      product: "",
      quantity: 1,
      purchasePrice: "",
    },
  ]);

  // Load Purchase history
  const fetchPurchases = async () => {
    try {
      const result = await getPurchases();

      setPurchases(result.data || []);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Load products
  const fetchProducts = async () => {
    try {
      const result = await getProducts();

      setProducts(result.data || []);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Load suppliers
  const fetchSuppliers = async () => {
    try {
      const result = await getSuppliers();

      setSuppliers(result.data || []);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Load everything
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchPurchases(),
        fetchProducts(),
        fetchSuppliers(),
      ]);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load purchase information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open purchase modal
  const handleOpenModal = () => {
    setFormError("");

    setFormData({
      supplier: "",
      invoiceNumber: "",
      purchaseDate:
        new Date().toISOString().split("T")[0],
      notes: "",
    });

    setItems([
      {
        product: "",
        quantity: 1,
        purchasePrice: "",
      },
    ]);

    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    if (saving) return;

    setShowModal(false);
    setFormError("");
  };

  // Header form values
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  // Purchase item change
  const handleItemChange = (
    index,
    field,
    value
  ) => {
    setItems((currentItems) => {
      const updatedItems = [
        ...currentItems,
      ];

      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };

      // When product changes,
      // automatically use existing product purchase price
      if (field === "product") {
        const selectedProduct =
          products.find(
            (product) =>
              product._id === value
          );

        if (selectedProduct) {
          updatedItems[index].purchasePrice =
            selectedProduct.purchasePrice;
        }
      }

      return updatedItems;
    });
  };

  // Add product row
  const handleAddItem = () => {
    setItems((currentItems) => [
      ...currentItems,
      {
        product: "",
        quantity: 1,
        purchasePrice: "",
      },
    ]);
  };

  // Remove product row
  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      return;
    }

    setItems((currentItems) =>
      currentItems.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  // Calculate line subtotal
  const calculateSubtotal = (item) => {
    const quantity =
      Number(item.quantity) || 0;

    const price =
      Number(item.purchasePrice) || 0;

    return quantity * price;
  };

  // Grand Total
  const grandTotal = items.reduce(
    (total, item) =>
      total + calculateSubtotal(item),
    0
  );

  // Save Purchase
  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!formData.supplier) {
      setFormError(
        "Please select a supplier."
      );
      return;
    }

    if (items.length === 0) {
      setFormError(
        "Add at least one product."
      );
      return;
    }

    const usedProducts = new Set();

    for (const item of items) {
      if (!item.product) {
        setFormError(
          "Please select a product for every row."
        );
        return;
      }

      if (usedProducts.has(item.product)) {
        setFormError(
          "The same product cannot be added more than once."
        );
        return;
      }

      usedProducts.add(item.product);

      const quantity =
        Number(item.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        setFormError(
          "Quantity must be a positive whole number."
        );
        return;
      }

      const purchasePrice =
        Number(item.purchasePrice);

      if (
        !Number.isFinite(
          purchasePrice
        ) ||
        purchasePrice < 0
      ) {
        setFormError(
          "Enter a valid purchase price for every product."
        );
        return;
      }
    }

    try {
      setSaving(true);

      const purchaseData = {
        supplier: formData.supplier,

        invoiceNumber:
          formData.invoiceNumber.trim(),

        purchaseDate:
          formData.purchaseDate,

        notes:
          formData.notes.trim(),

        items: items.map((item) => ({
          product: item.product,
          quantity: Number(
            item.quantity
          ),
          purchasePrice: Number(
            item.purchasePrice
          ),
        })),
      };

      const result =
        await createPurchase(
          purchaseData
        );

      setPurchases(
        (currentPurchases) => [
          result.data,
          ...currentPurchases,
        ]
      );

      // Reload product quantities
      // because Purchase automatically
      // increases stock on backend
      await fetchProducts();

      setShowModal(false);

      setFormData({
        supplier: "",
        invoiceNumber: "",
        purchaseDate:
          new Date()
            .toISOString()
            .split("T")[0],
        notes: "",
      });

      setItems([
        {
          product: "",
          quantity: 1,
          purchasePrice: "",
        },
      ]);
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.message ||
        "Failed to create purchase.";

      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  // Search Purchase History
  const filteredPurchases =
    purchases.filter((purchase) => {
      const searchValue =
        search.toLowerCase().trim();

      const purchaseNumber =
        purchase.purchaseNumber
          ?.toLowerCase() || "";

      const supplierName =
        purchase.supplierName
          ?.toLowerCase() || "";

      const invoice =
        purchase.invoiceNumber
          ?.toLowerCase() || "";

      return (
        purchaseNumber.includes(
          searchValue
        ) ||
        supplierName.includes(
          searchValue
        ) ||
        invoice.includes(
          searchValue
        )
      );
    });

  const activeSuppliers =
    suppliers.filter(
      (supplier) =>
        supplier.status === "active"
    );

  const activeProducts =
    products.filter(
      (product) =>
        product.status === "active"
    );

  return (
    <div className="purchases-page">
      {/* Header */}
      <div className="purchases-header">
        <div>
          <h1>Purchases</h1>

          <p>
            Record supplier purchases and
            restock inventory.
          </p>
        </div>

        <button
          type="button"
          className="add-purchase-btn"
          onClick={handleOpenModal}
        >
          <Plus size={18} />
          New Purchase
        </button>
      </div>

      {/* Toolbar */}
      <div className="purchases-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search purchases..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />
        </div>

        <div className="purchase-count">
          <ReceiptText size={18} />

          {purchases.length} Purchases
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="products-state">
          <p>
            Loading purchases...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="products-state error-state">
          <p>{error}</p>

          <button
            type="button"
            onClick={loadData}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading &&
        !error &&
        filteredPurchases.length === 0 && (
          <div className="products-state empty-state">
            <ShoppingCart size={42} />

            <h3>
              {purchases.length === 0
                ? "No purchases yet"
                : "No purchases found"}
            </h3>

            <p>
              {purchases.length === 0
                ? "Record your first supplier purchase."
                : "Try changing your search."}
            </p>
          </div>
        )}

      {/* Purchase History */}
      {!loading &&
        !error &&
        filteredPurchases.length > 0 && (
          <div className="purchases-table-container">
            <table className="purchases-table">
              <thead>
                <tr>
                  <th>Purchase #</th>
                  <th>Supplier</th>
                  <th>Invoice</th>
                  <th>Products</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredPurchases.map(
                  (purchase) => (
                    <tr
                      key={purchase._id}
                    >
                      <td>
                        <span className="purchase-number">
                          {
                            purchase.purchaseNumber
                          }
                        </span>
                      </td>

                      <td>
                        <div className="purchase-supplier">
                          <Truck
                            size={15}
                          />

                          <span>
                            {
                              purchase.supplierName
                            }
                          </span>
                        </div>
                      </td>

                      <td>
                        {purchase.invoiceNumber ||
                          "-"}
                      </td>

                      <td>
                        <div className="purchase-products">
                          <Package
                            size={15}
                          />

                          {purchase.items
                            ?.length || 0}{" "}
                          item
                          {purchase.items
                            ?.length !== 1
                            ? "s"
                            : ""}
                        </div>
                      </td>

                      <td>
                        <strong>
                          Rs.{" "}
                          {Number(
                            purchase.totalAmount
                          ).toLocaleString()}
                        </strong>
                      </td>

                      <td>
                        {new Date(
                          purchase.purchaseDate
                        ).toLocaleDateString()}
                      </td>

                      <td>
                        <span
                          className={`status ${
                            purchase.status ===
                            "received"
                              ? "status-active"
                              : "status-inactive"
                          }`}
                        >
                          {purchase.status}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

      {/* Purchase Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={
            handleCloseModal
          }
        >
          <div
            className="purchase-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <h2>New Purchase</h2>

                <p>
                  Record supplier stock
                  received into inventory.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  handleCloseModal
                }
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

              {/* Purchase Details */}
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Supplier *
                  </label>

                  <select
                    name="supplier"
                    value={
                      formData.supplier
                    }
                    onChange={
                      handleInputChange
                    }
                  >
                    <option value="">
                      Select supplier
                    </option>

                    {activeSuppliers.map(
                      (supplier) => (
                        <option
                          key={
                            supplier._id
                          }
                          value={
                            supplier._id
                          }
                        >
                          {supplier.name}
                          {supplier.company
                            ? ` - ${supplier.company}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Invoice Number
                  </label>

                  <input
                    type="text"
                    name="invoiceNumber"
                    value={
                      formData.invoiceNumber
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="e.g. INV-1025"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Purchase Date
                  </label>

                  <input
                    type="date"
                    name="purchaseDate"
                    value={
                      formData.purchaseDate
                    }
                    onChange={
                      handleInputChange
                    }
                  />
                </div>
              </div>

              {/* Product Items */}
              <div className="purchase-items-section">
                <div className="purchase-items-header">
                  <div>
                    <h3>
                      Purchase Items
                    </h3>

                    <p>
                      Add products received
                      from this supplier.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="add-item-btn"
                    onClick={
                      handleAddItem
                    }
                  >
                    <Plus size={16} />
                    Add Product
                  </button>
                </div>

                <div className="purchase-items-list">
                  {items.map(
                    (item, index) => (
                      <div
                        className="purchase-item-row"
                        key={index}
                      >
                        <div className="form-group purchase-product-field">
                          <label>
                            Product
                          </label>

                          <select
                            value={
                              item.product
                            }
                            onChange={(
                              event
                            ) =>
                              handleItemChange(
                                index,
                                "product",
                                event
                                  .target
                                  .value
                              )
                            }
                          >
                            <option value="">
                              Select product
                            </option>

                            {activeProducts.map(
                              (
                                product
                              ) => (
                                <option
                                  key={
                                    product._id
                                  }
                                  value={
                                    product._id
                                  }
                                >
                                  {
                                    product.name
                                  }{" "}
                                  (
                                  {
                                    product.sku
                                  }
                                  )
                                </option>
                              )
                            )}
                          </select>
                        </div>

                        <div className="form-group purchase-small-field">
                          <label>
                            Quantity
                          </label>

                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={
                              item.quantity
                            }
                            onChange={(
                              event
                            ) =>
                              handleItemChange(
                                index,
                                "quantity",
                                event
                                  .target
                                  .value
                              )
                            }
                          />
                        </div>

                        <div className="form-group purchase-price-field">
                          <label>
                            Purchase Price
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              item.purchasePrice
                            }
                            onChange={(
                              event
                            ) =>
                              handleItemChange(
                                index,
                                "purchasePrice",
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="0"
                          />
                        </div>

                        <div className="purchase-subtotal">
                          <label>
                            Subtotal
                          </label>

                          <strong>
                            Rs.{" "}
                            {calculateSubtotal(
                              item
                            ).toLocaleString()}
                          </strong>
                        </div>

                        <button
                          type="button"
                          className="icon-btn delete-btn purchase-remove-btn"
                          title="Remove product"
                          onClick={() =>
                            handleRemoveItem(
                              index
                            )
                          }
                          disabled={
                            items.length ===
                            1
                          }
                        >
                          <Trash2
                            size={17}
                          />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="form-group full-width">
                <label>Notes</label>

                <textarea
                  name="notes"
                  value={
                    formData.notes
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Optional purchase notes..."
                  rows="3"
                />
              </div>

              {/* Total */}
              <div className="purchase-total-box">
                <span>
                  Grand Total
                </span>

                <strong>
                  Rs.{" "}
                  {grandTotal.toLocaleString()}
                </strong>
              </div>

              {/* Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    handleCloseModal
                  }
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
                    ? "Saving Purchase..."
                    : "Save Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Purchases;