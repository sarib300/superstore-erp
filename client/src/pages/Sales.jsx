import { useEffect, useState } from "react";

import {
  Plus,
  Search,
  ShoppingBag,
  X,
  Trash2,
  Package,
  CreditCard,
  Banknote,
  ReceiptText,
} from "lucide-react";

import {
  getSales,
  createSale,
} from "../services/saleService";

import {
  getProducts,
} from "../services/productService";

function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    customerName: "",
    discount: "0",
    paymentMethod: "cash",
    saleDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [items, setItems] = useState([
    {
      product: "",
      quantity: 1,
    },
  ]);

  // Fetch sales
  const fetchSales = async () => {
    try {
      const result = await getSales();

      setSales(result.data || []);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const result = await getProducts();

      setProducts(result.data || []);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchSales(),
        fetchProducts(),
      ]);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load sales information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open sale modal
  const handleOpenModal = () => {
    setFormError("");

    setFormData({
      customerName: "",
      discount: "0",
      paymentMethod: "cash",
      saleDate: new Date().toISOString().split("T")[0],
      notes: "",
    });

    setItems([
      {
        product: "",
        quantity: 1,
      },
    ]);

    setShowModal(true);
  };

  // Close sale modal
  const handleCloseModal = () => {
    if (saving) return;

    setShowModal(false);
    setFormError("");
  };

  // Form change
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  // Item change
  const handleItemChange = (
    index,
    field,
    value
  ) => {
    setItems((currentItems) => {
      const updatedItems = [...currentItems];

      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };

      return updatedItems;
    });
  };

  // Add cart row
  const handleAddItem = () => {
    setItems((currentItems) => [
      ...currentItems,
      {
        product: "",
        quantity: 1,
      },
    ]);
  };

  // Remove cart row
  const handleRemoveItem = (index) => {
    if (items.length === 1) return;

    setItems((currentItems) =>
      currentItems.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  // Selected product
  const getProduct = (productId) => {
    return products.find(
      (product) =>
        product._id === productId
    );
  };

  // Line total
  const calculateSubtotal = (item) => {
    const product = getProduct(
      item.product
    );

    if (!product) return 0;

    const quantity =
      Number(item.quantity) || 0;

    const price =
      Number(product.sellingPrice) || 0;

    return quantity * price;
  };

  // Subtotal before discount
  const subtotalAmount = items.reduce(
    (total, item) =>
      total + calculateSubtotal(item),
    0
  );

  const discountAmount =
    Number(formData.discount) || 0;

  const grandTotal = Math.max(
    0,
    subtotalAmount - discountAmount
  );

  // Checkout
  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

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
          "The same product cannot be added twice."
        );
        return;
      }

      usedProducts.add(item.product);

      const product =
        getProduct(item.product);

      if (!product) {
        setFormError(
          "One selected product could not be found."
        );
        return;
      }

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

      if (
        quantity >
        Number(product.quantity)
      ) {
        setFormError(
          `Only ${product.quantity} ${
            product.unit || "pcs"
          } available for ${product.name}.`
        );
        return;
      }
    }

    if (
      !Number.isFinite(discountAmount) ||
      discountAmount < 0
    ) {
      setFormError(
        "Discount must be a valid non-negative amount."
      );
      return;
    }

    if (
      discountAmount >
      subtotalAmount
    ) {
      setFormError(
        "Discount cannot be greater than subtotal."
      );
      return;
    }

    try {
      setSaving(true);

      const saleData = {
        customerName:
          formData.customerName.trim(),

        discount:
          discountAmount,

        paymentMethod:
          formData.paymentMethod,

        saleDate:
          formData.saleDate,

        notes:
          formData.notes.trim(),

        items: items.map((item) => ({
          product: item.product,
          quantity: Number(
            item.quantity
          ),
        })),
      };

      const result =
        await createSale(saleData);

      setSales((currentSales) => [
        result.data,
        ...currentSales,
      ]);

      // Reload products because
      // stock is reduced on backend
      await fetchProducts();

      setShowModal(false);

      setFormData({
        customerName: "",
        discount: "0",
        paymentMethod: "cash",
        saleDate:
          new Date()
            .toISOString()
            .split("T")[0],
        notes: "",
      });

      setItems([
        {
          product: "",
          quantity: 1,
        },
      ]);
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.message ||
        "Failed to complete sale.";

      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  // Search sales
  const filteredSales =
    sales.filter((sale) => {
      const searchValue =
        search.toLowerCase().trim();

      const saleNumber =
        sale.saleNumber?.toLowerCase() || "";

      const customerName =
        sale.customerName?.toLowerCase() || "";

      const paymentMethod =
        sale.paymentMethod?.toLowerCase() || "";

      return (
        saleNumber.includes(searchValue) ||
        customerName.includes(searchValue) ||
        paymentMethod.includes(searchValue)
      );
    });

  const activeProducts =
    products.filter(
      (product) =>
        product.status === "active"
    );

  return (
    <div className="sales-page">
      {/* Header */}
      <div className="sales-header">
        <div>
          <h1>Sales / POS</h1>

          <p>
            Process supermarket sales and
            automatically update inventory.
          </p>
        </div>

        <button
          type="button"
          className="add-sale-btn"
          onClick={handleOpenModal}
        >
          <Plus size={18} />
          New Sale
        </button>
      </div>

      {/* Toolbar */}
      <div className="sales-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search sales..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="sale-count">
          <ReceiptText size={18} />
          {sales.length} Sales
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="products-state">
          <p>Loading sales...</p>
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
        filteredSales.length === 0 && (
          <div className="products-state empty-state">
            <ShoppingBag size={42} />

            <h3>
              {sales.length === 0
                ? "No sales yet"
                : "No sales found"}
            </h3>

            <p>
              {sales.length === 0
                ? "Complete your first sale to get started."
                : "Try changing your search."}
            </p>
          </div>
        )}

      {/* Sales History */}
      {!loading &&
        !error &&
        filteredSales.length > 0 && (
          <div className="sales-table-container">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Sale #</th>
                  <th>Customer</th>
                  <th>Products</th>
                  <th>Subtotal</th>
                  <th>Discount</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredSales.map(
                  (sale) => (
                    <tr key={sale._id}>
                      <td>
                        <span className="sale-number">
                          {sale.saleNumber}
                        </span>
                      </td>

                      <td>
                        {sale.customerName ||
                          "Walk-in Customer"}
                      </td>

                      <td>
                        <div className="sale-products">
                          <Package size={15} />

                          {sale.items?.length || 0}{" "}
                          item
                          {sale.items?.length !== 1
                            ? "s"
                            : ""}
                        </div>
                      </td>

                      <td>
                        Rs.{" "}
                        {Number(
                          sale.subtotalAmount
                        ).toLocaleString()}
                      </td>

                      <td>
                        Rs.{" "}
                        {Number(
                          sale.discount
                        ).toLocaleString()}
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
                        <span className="payment-method">
                          {sale.paymentMethod ===
                          "cash" ? (
                            <Banknote size={14} />
                          ) : (
                            <CreditCard size={14} />
                          )}

                          {sale.paymentMethod}
                        </span>
                      </td>

                      <td>
                        {new Date(
                          sale.saleDate
                        ).toLocaleDateString()}
                      </td>

                      <td>
                        <span
                          className={`status ${
                            sale.status ===
                            "completed"
                              ? "status-active"
                              : "status-inactive"
                          }`}
                        >
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

      {/* POS Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={handleCloseModal}
        >
          <div
            className="sale-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>New Sale</h2>

                <p>
                  Add products and complete
                  customer checkout.
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

              {/* Sale Details */}
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Customer Name
                  </label>

                  <input
                    type="text"
                    name="customerName"
                    value={
                      formData.customerName
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Walk-in Customer"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Payment Method
                  </label>

                  <select
                    name="paymentMethod"
                    value={
                      formData.paymentMethod
                    }
                    onChange={
                      handleInputChange
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

                <div className="form-group">
                  <label>Sale Date</label>

                  <input
                    type="date"
                    name="saleDate"
                    value={
                      formData.saleDate
                    }
                    onChange={
                      handleInputChange
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    Discount (Rs.)
                  </label>

                  <input
                    type="number"
                    name="discount"
                    value={
                      formData.discount
                    }
                    onChange={
                      handleInputChange
                    }
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Cart */}
              <div className="sale-items-section">
                <div className="sale-items-header">
                  <div>
                    <h3>
                      Sale Items
                    </h3>

                    <p>
                      Select products and
                      quantities.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="add-item-btn"
                    onClick={handleAddItem}
                  >
                    <Plus size={16} />
                    Add Product
                  </button>
                </div>

                <div className="sale-items-list">
                  {items.map(
                    (item, index) => {
                      const selectedProduct =
                        getProduct(
                          item.product
                        );

                      return (
                        <div
                          className="sale-item-row"
                          key={index}
                        >
                          <div className="form-group sale-product-field">
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
                                  event.target
                                    .value
                                )
                              }
                            >
                              <option value="">
                                Select product
                              </option>

                              {activeProducts.map(
                                (product) => (
                                  <option
                                    key={
                                      product._id
                                    }
                                    value={
                                      product._id
                                    }
                                    disabled={
                                      Number(
                                        product.quantity
                                      ) <= 0
                                    }
                                  >
                                    {
                                      product.name
                                    }{" "}
                                    (
                                    {
                                      product.sku
                                    }
                                    ) - Stock:{" "}
                                    {
                                      product.quantity
                                    }
                                  </option>
                                )
                              )}
                            </select>
                          </div>

                          <div className="sale-stock-info">
                            <label>
                              Stock
                            </label>

                            <strong>
                              {selectedProduct
                                ? `${selectedProduct.quantity} ${
                                    selectedProduct.unit ||
                                    "pcs"
                                  }`
                                : "-"}
                            </strong>
                          </div>

                          <div className="sale-price-info">
                            <label>
                              Price
                            </label>

                            <strong>
                              Rs.{" "}
                              {selectedProduct
                                ? Number(
                                    selectedProduct.sellingPrice
                                  ).toLocaleString()
                                : "0"}
                            </strong>
                          </div>

                          <div className="form-group sale-quantity-field">
                            <label>
                              Quantity
                            </label>

                            <input
                              type="number"
                              min="1"
                              step="1"
                              max={
                                selectedProduct
                                  ? selectedProduct.quantity
                                  : undefined
                              }
                              value={
                                item.quantity
                              }
                              onChange={(
                                event
                              ) =>
                                handleItemChange(
                                  index,
                                  "quantity",
                                  event.target
                                    .value
                                )
                              }
                            />
                          </div>

                          <div className="sale-subtotal">
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
                            className="icon-btn delete-btn sale-remove-btn"
                            title="Remove product"
                            onClick={() =>
                              handleRemoveItem(
                                index
                              )
                            }
                            disabled={
                              items.length === 1
                            }
                          >
                            <Trash2
                              size={17}
                            />
                          </button>
                        </div>
                      );
                    }
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
                  placeholder="Optional sale notes..."
                  rows="3"
                />
              </div>

              {/* Totals */}
              <div className="sale-summary">
                <div>
                  <span>Subtotal</span>

                  <strong>
                    Rs.{" "}
                    {subtotalAmount.toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span>Discount</span>

                  <strong>
                    - Rs.{" "}
                    {discountAmount.toLocaleString()}
                  </strong>
                </div>

                <div className="sale-grand-total">
                  <span>
                    Grand Total
                  </span>

                  <strong>
                    Rs.{" "}
                    {grandTotal.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Footer */}
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
                    ? "Processing Sale..."
                    : "Complete Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;