import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
  X,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";

import {
  getProducts,
  createProduct,
  updateProduct,
  adjustProductStock,
  deleteProduct,
} from "../services/productService";

function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add / Edit Product modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Editing product
  const [editingProduct, setEditingProduct] = useState(null);

  // Stock modal
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockType, setStockType] = useState("in");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockError, setStockError] = useState("");
  const [stockSaving, setStockSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    purchasePrice: "",
    sellingPrice: "",
    quantity: "",
    minimumStockLevel: "5",
    supplier: "",
    unit: "pcs",
    description: "",
    status: "active",
  });

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getProducts();

      setProducts(result.data || []);
    } catch (error) {
      console.error(error);
      setError("Unable to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Form input change
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  // Open Add modal
  const handleOpenModal = () => {
    setFormError("");
    setEditingProduct(null);

    setFormData({
      name: "",
      sku: "",
      category: "",
      purchasePrice: "",
      sellingPrice: "",
      quantity: "",
      minimumStockLevel: "5",
      supplier: "",
      unit: "pcs",
      description: "",
      status: "active",
    });

    setShowModal(true);
  };

  // Open Edit modal
  const handleEdit = (product) => {
    setFormError("");
    setEditingProduct(product);

    setFormData({
      name: product.name || "",
      sku: product.sku || "",
      category: product.category || "",
      purchasePrice: product.purchasePrice ?? "",
      sellingPrice: product.sellingPrice ?? "",
      quantity: product.quantity ?? "",
      minimumStockLevel: product.minimumStockLevel ?? "5",
      supplier: product.supplier || "",
      unit: product.unit || "pcs",
      description: product.description || "",
      status: product.status || "active",
    });

    setShowModal(true);
  };

  // Close Add/Edit modal
  const handleCloseModal = () => {
    if (saving) return;

    setShowModal(false);
    setFormError("");
    setEditingProduct(null);
  };

  // Add / Update product
  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Product name is required.");
      return;
    }

    if (!formData.sku.trim()) {
      setFormError("SKU is required.");
      return;
    }

    if (
      formData.purchasePrice === "" ||
      Number(formData.purchasePrice) < 0
    ) {
      setFormError("Enter a valid purchase price.");
      return;
    }

    if (
      formData.sellingPrice === "" ||
      Number(formData.sellingPrice) < 0
    ) {
      setFormError("Enter a valid selling price.");
      return;
    }

    if (
      Number(formData.sellingPrice) <
      Number(formData.purchasePrice)
    ) {
      setFormError(
        "Selling price cannot be lower than purchase price."
      );
      return;
    }

    if (
      formData.quantity === "" ||
      Number(formData.quantity) < 0
    ) {
      setFormError("Enter a valid quantity.");
      return;
    }

    if (
      formData.minimumStockLevel === "" ||
      Number(formData.minimumStockLevel) < 0
    ) {
      setFormError("Enter a valid minimum stock level.");
      return;
    }

    try {
      setSaving(true);

      const productData = {
        name: formData.name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        category: formData.category.trim(),
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
        quantity: Number(formData.quantity),
        minimumStockLevel: Number(
          formData.minimumStockLevel
        ),
        supplier: formData.supplier.trim(),
        unit: formData.unit.trim() || "pcs",
        description: formData.description.trim(),
        status: formData.status,
      };

      if (editingProduct) {
        const result = await updateProduct(
          editingProduct._id,
          productData
        );

        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product._id === editingProduct._id
              ? result.data
              : product
          )
        );
      } else {
        const result = await createProduct(productData);

        setProducts((currentProducts) => [
          result.data,
          ...currentProducts,
        ]);
      }

      setShowModal(false);
      setEditingProduct(null);

      setFormData({
        name: "",
        sku: "",
        category: "",
        purchasePrice: "",
        sellingPrice: "",
        quantity: "",
        minimumStockLevel: "5",
        supplier: "",
        unit: "pcs",
        description: "",
        status: "active",
      });
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.message ||
        (editingProduct
          ? "Failed to update product."
          : "Failed to create product.");

      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  // Delete product
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      await deleteProduct(id);

      setProducts((currentProducts) =>
        currentProducts.filter(
          (product) => product._id !== id
        )
      );
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.message ||
        "Failed to delete product.";

      alert(message);
    }
  };

  // Open Stock modal
  const handleOpenStockModal = (product, type) => {
    setStockProduct(product);
    setStockType(type);
    setStockQuantity("");
    setStockError("");
    setShowStockModal(true);
  };

  // Close Stock modal
  const handleCloseStockModal = () => {
    if (stockSaving) return;

    setShowStockModal(false);
    setStockProduct(null);
    setStockQuantity("");
    setStockError("");
  };

  // Stock In / Stock Out
  const handleStockSubmit = async (event) => {
    event.preventDefault();

    setStockError("");

    const quantity = Number(stockQuantity);

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      setStockError(
        "Please enter a quantity greater than 0."
      );
      return;
    }

    if (
      stockType === "out" &&
      quantity > Number(stockProduct.quantity)
    ) {
      setStockError(
        `Only ${stockProduct.quantity} ${
          stockProduct.unit || "pcs"
        } available in stock.`
      );
      return;
    }

    try {
      setStockSaving(true);

      const result = await adjustProductStock(
        stockProduct._id,
        {
          type: stockType,
          quantity,
        }
      );

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product._id === stockProduct._id
            ? result.data
            : product
        )
      );

      setShowStockModal(false);
      setStockProduct(null);
      setStockQuantity("");
      setStockError("");
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.message ||
        "Failed to update stock.";

      setStockError(message);
    } finally {
      setStockSaving(false);
    }
  };

  // Search
  const filteredProducts = products.filter(
    (product) => {
      const searchValue = search
        .toLowerCase()
        .trim();

      const productName =
        product.name?.toLowerCase() || "";

      const productSku =
        product.sku?.toLowerCase() || "";

      const productCategory =
        product.category?.toLowerCase() || "";

      return (
        productName.includes(searchValue) ||
        productSku.includes(searchValue) ||
        productCategory.includes(searchValue)
      );
    }
  );

  return (
    <div className="products-page">
      {/* Header */}
      <div className="products-header">
        <div>
          <h1>Products</h1>
          <p>
            Manage your store products and inventory.
          </p>
        </div>

        <button
          type="button"
          className="add-product-btn"
          onClick={handleOpenModal}
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="products-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="product-count">
          <Package size={18} />
          {products.length} Products
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="products-state">
          <p>Loading products...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="products-state error-state">
          <p>{error}</p>

          <button
            type="button"
            onClick={fetchProducts}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading &&
        !error &&
        filteredProducts.length === 0 && (
          <div className="products-state empty-state">
            <Package size={42} />

            <h3>
              {products.length === 0
                ? "No products yet"
                : "No products found"}
            </h3>

            <p>
              {products.length === 0
                ? "Add your first product to get started."
                : "Try changing your search."}
            </p>
          </div>
        )}

      {/* Products Table */}
      {!loading &&
        !error &&
        filteredProducts.length > 0 && (
          <div className="products-table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Purchase Price</th>
                  <th>Selling Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const isLowStock =
                    Number(product.quantity) <=
                    Number(
                      product.minimumStockLevel
                    );

                  return (
                    <tr key={product._id}>
                      <td>
                        <div className="product-name">
                          <div className="product-icon">
                            <Package size={18} />
                          </div>

                          <div>
                            <strong>
                              {product.name}
                            </strong>

                            {product.description && (
                              <small>
                                {
                                  product.description
                                }
                              </small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="sku">
                          {product.sku}
                        </span>
                      </td>

                      <td>
                        {product.category || "-"}
                      </td>

                      <td>
                        Rs.{" "}
                        {Number(
                          product.purchasePrice
                        ).toLocaleString()}
                      </td>

                      <td>
                        <strong>
                          Rs.{" "}
                          {Number(
                            product.sellingPrice
                          ).toLocaleString()}
                        </strong>
                      </td>

                      <td>
                        <div
                          className={
                            isLowStock
                              ? "stock low-stock"
                              : "stock"
                          }
                        >
                          {isLowStock && (
                            <AlertTriangle
                              size={15}
                            />
                          )}

                          {product.quantity}{" "}
                          {product.unit}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`status ${
                            product.status ===
                            "active"
                              ? "status-active"
                              : "status-inactive"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>

                      <td>
                        <div className="product-actions">
                          {/* Stock In */}
                          <button
                            type="button"
                            title="Stock In"
                            className="icon-btn"
                            onClick={() =>
                              handleOpenStockModal(
                                product,
                                "in"
                              )
                            }
                          >
                            <ArrowDownToLine
                              size={17}
                            />
                          </button>

                          {/* Stock Out */}
                          <button
                            type="button"
                            title="Stock Out"
                            className="icon-btn"
                            onClick={() =>
                              handleOpenStockModal(
                                product,
                                "out"
                              )
                            }
                          >
                            <ArrowUpFromLine
                              size={17}
                            />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            title="Edit product"
                            className="icon-btn"
                            onClick={() =>
                              handleEdit(product)
                            }
                          >
                            <Pencil size={17} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            title="Delete product"
                            className="icon-btn delete-btn"
                            onClick={() =>
                              handleDelete(
                                product._id
                              )
                            }
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p>
                  {editingProduct
                    ? "Update the product information."
                    : "Add a new product to your inventory."}
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
                    Product Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={
                      handleInputChange
                    }
                    placeholder="e.g. Coca Cola 1.5L"
                  />
                </div>

                <div className="form-group">
                  <label>SKU *</label>

                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={
                      handleInputChange
                    }
                    placeholder="e.g. COKE-1500"
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>

                  <input
                    type="text"
                    name="category"
                    value={
                      formData.category
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="e.g. Beverages"
                  />
                </div>

                <div className="form-group">
                  <label>Supplier</label>

                  <input
                    type="text"
                    name="supplier"
                    value={
                      formData.supplier
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="e.g. ABC Distributors"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Purchase Price *
                  </label>

                  <input
                    type="number"
                    name="purchasePrice"
                    value={
                      formData.purchasePrice
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Selling Price *
                  </label>

                  <input
                    type="number"
                    name="sellingPrice"
                    value={
                      formData.sellingPrice
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Quantity *</label>

                  <input
                    type="number"
                    name="quantity"
                    value={
                      formData.quantity
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Minimum Stock
                  </label>

                  <input
                    type="number"
                    name="minimumStockLevel"
                    value={
                      formData.minimumStockLevel
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="5"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Unit</label>

                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={
                      handleInputChange
                    }
                    placeholder="pcs"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>

                  <select
                    name="status"
                    value={
                      formData.status
                    }
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
                <label>Description</label>

                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Optional product description..."
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
                    ? editingProduct
                      ? "Updating..."
                      : "Saving..."
                    : editingProduct
                      ? "Update Product"
                      : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock In / Stock Out Modal */}
      {showStockModal && stockProduct && (
        <div
          className="modal-overlay"
          onMouseDown={
            handleCloseStockModal
          }
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
                  {stockType === "in"
                    ? "Stock In"
                    : "Stock Out"}
                </h2>

                <p>
                  {stockType === "in"
                    ? "Add inventory stock for this product."
                    : "Remove inventory stock for this product."}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  handleCloseStockModal
                }
                disabled={stockSaving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="product-form"
              onSubmit={
                handleStockSubmit
              }
            >
              {stockError && (
                <div className="form-error">
                  {stockError}
                </div>
              )}

              <div className="form-group">
                <label>Product</label>

                <input
                  type="text"
                  value={
                    stockProduct.name
                  }
                  disabled
                />
              </div>

              <div className="form-group">
                <label>
                  Current Stock
                </label>

                <input
                  type="text"
                  value={`${stockProduct.quantity} ${
                    stockProduct.unit ||
                    "pcs"
                  }`}
                  disabled
                />
              </div>

              <div className="form-group">
                <label>
                  {stockType === "in"
                    ? "Quantity to Add *"
                    : "Quantity to Remove *"}
                </label>

                <input
                  type="number"
                  value={stockQuantity}
                  onChange={(event) =>
                    setStockQuantity(
                      event.target.value
                    )
                  }
                  min="1"
                  step="1"
                  placeholder="Enter quantity"
                  autoFocus
                />
              </div>

              {stockQuantity &&
                Number(stockQuantity) > 0 && (
                  <div className="form-group">
                    <label>
                      New Stock
                    </label>

                    <input
                      type="text"
                      disabled
                      value={`${
                        stockType === "in"
                          ? Number(
                              stockProduct.quantity
                            ) +
                            Number(
                              stockQuantity
                            )
                          : Math.max(
                              0,
                              Number(
                                stockProduct.quantity
                              ) -
                                Number(
                                  stockQuantity
                                )
                            )
                      } ${
                        stockProduct.unit ||
                        "pcs"
                      }`}
                    />
                  </div>
                )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    handleCloseStockModal
                  }
                  disabled={stockSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-product-btn"
                  disabled={stockSaving}
                >
                  {stockSaving
                    ? "Updating Stock..."
                    : stockType === "in"
                      ? "Add Stock"
                      : "Remove Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;