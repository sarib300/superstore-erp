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
  UserRound,
} from "lucide-react";

import {
  getSales,
  createSale,
} from "../services/saleService";

import {
  getProducts,
} from "../services/productService";

import {
  getCustomers,
} from "../services/customerService";


function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [formError, setFormError] =
    useState("");


  const getInitialFormData = () => ({
    customer: "",
    discount: "0",
    paymentMethod: "cash",
    saleDate:
      new Date()
        .toISOString()
        .split("T")[0],
    notes: "",
  });


  const [formData, setFormData] =
    useState(getInitialFormData());


  const [items, setItems] = useState([
    {
      product: "",
      quantity: 1,
    },
  ]);


  // =========================
  // FETCH SALES
  // =========================

  const fetchSales = async () => {
    try {
      const result =
        await getSales();

      setSales(
        result.data || []
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };


  // =========================
  // FETCH PRODUCTS
  // =========================

  const fetchProducts = async () => {
    try {
      const result =
        await getProducts();

      setProducts(
        result.data || []
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };


  // =========================
  // FETCH CUSTOMERS
  // =========================

  const fetchCustomers = async () => {
    try {
      const result =
        await getCustomers();

      setCustomers(
        result.data || []
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  };


  // =========================
  // LOAD PAGE DATA
  // =========================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchSales(),
        fetchProducts(),
        fetchCustomers(),
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


  // =========================
  // OPEN SALE MODAL
  // =========================

  const handleOpenModal = () => {
    setFormError("");

    setFormData(
      getInitialFormData()
    );

    setItems([
      {
        product: "",
        quantity: 1,
      },
    ]);

    setShowModal(true);
  };


  // =========================
  // CLOSE SALE MODAL
  // =========================

  const handleCloseModal = () => {
    if (saving) return;

    setShowModal(false);
    setFormError("");
  };


  // =========================
  // FORM CHANGE
  // =========================

  const handleInputChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (currentData) => ({
        ...currentData,
        [name]: value,
      })
    );
  };


  // =========================
  // ITEM CHANGE
  // =========================

  const handleItemChange = (
    index,
    field,
    value
  ) => {
    setItems(
      (currentItems) => {
        const updatedItems = [
          ...currentItems,
        ];

        updatedItems[index] = {
          ...updatedItems[index],
          [field]: value,
        };

        return updatedItems;
      }
    );
  };


  // =========================
  // ADD CART ROW
  // =========================

  const handleAddItem = () => {
    setItems(
      (currentItems) => [
        ...currentItems,
        {
          product: "",
          quantity: 1,
        },
      ]
    );
  };


  // =========================
  // REMOVE CART ROW
  // =========================

  const handleRemoveItem = (
    index
  ) => {
    if (items.length === 1) {
      return;
    }

    setItems(
      (currentItems) =>
        currentItems.filter(
          (_, itemIndex) =>
            itemIndex !== index
        )
    );
  };


  // =========================
  // FIND SELECTED PRODUCT
  // =========================

  const getProduct = (
    productId
  ) => {
    return products.find(
      (product) =>
        product._id ===
        productId
    );
  };


  // =========================
  // LINE SUBTOTAL
  // =========================

  const calculateSubtotal = (
    item
  ) => {
    const product =
      getProduct(
        item.product
      );

    if (!product) {
      return 0;
    }

    const quantity =
      Number(
        item.quantity
      ) || 0;

    const price =
      Number(
        product.sellingPrice
      ) || 0;

    return (
      quantity *
      price
    );
  };


  // =========================
  // TOTALS
  // =========================

  const subtotalAmount =
    items.reduce(
      (total, item) =>
        total +
        calculateSubtotal(
          item
        ),
      0
    );


  const discountAmount =
    Number(
      formData.discount
    ) || 0;


  const grandTotal =
    Math.max(
      0,
      subtotalAmount -
        discountAmount
    );


  // =========================
  // CHECKOUT
  // =========================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      setFormError("");


      if (
        items.length === 0
      ) {
        setFormError(
          "Add at least one product."
        );

        return;
      }


      const usedProducts =
        new Set();


      for (
        const item of items
      ) {

        if (!item.product) {
          setFormError(
            "Please select a product for every row."
          );

          return;
        }


        if (
          usedProducts.has(
            item.product
          )
        ) {
          setFormError(
            "The same product cannot be added twice."
          );

          return;
        }


        usedProducts.add(
          item.product
        );


        const product =
          getProduct(
            item.product
          );


        if (!product) {
          setFormError(
            "One selected product could not be found."
          );

          return;
        }


        const quantity =
          Number(
            item.quantity
          );


        if (
          !Number.isInteger(
            quantity
          ) ||
          quantity <= 0
        ) {
          setFormError(
            "Quantity must be a positive whole number."
          );

          return;
        }


        if (
          quantity >
          Number(
            product.quantity
          )
        ) {
          setFormError(
            `Only ${product.quantity} ${
              product.unit ||
              "pcs"
            } available for ${product.name}.`
          );

          return;
        }
      }


      if (
        !Number.isFinite(
          discountAmount
        ) ||
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
          discount:
            discountAmount,

          paymentMethod:
            formData.paymentMethod,

          saleDate:
            formData.saleDate,

          notes:
            formData.notes.trim(),

          items:
            items.map(
              (item) => ({
                product:
                  item.product,

                quantity:
                  Number(
                    item.quantity
                  ),
              })
            ),
        };


        // Registered customer selected
        if (
          formData.customer
        ) {
          saleData.customer =
            formData.customer;
        }


        const result =
          await createSale(
            saleData
          );


        setSales(
          (currentSales) => [
            result.data,
            ...currentSales,
          ]
        );


        // Stock reduced on backend
        await fetchProducts();


        setShowModal(false);


        setFormData(
          getInitialFormData()
        );


        setItems([
          {
            product: "",
            quantity: 1,
          },
        ]);

      } catch (error) {
        console.error(error);

        const message =
          error.response
            ?.data
            ?.message ||
          "Failed to complete sale.";

        setFormError(
          message
        );

      } finally {
        setSaving(false);
      }
    };


  // =========================
  // SEARCH SALES
  // =========================

  const filteredSales =
    sales.filter(
      (sale) => {

        const searchValue =
          search
            .toLowerCase()
            .trim();


        const saleNumber =
          sale.saleNumber
            ?.toLowerCase() ||
          "";


        const customerName =
          sale.customerName
            ?.toLowerCase() ||
          "";


        const paymentMethod =
          sale.paymentMethod
            ?.toLowerCase() ||
          "";


        return (
          saleNumber.includes(
            searchValue
          ) ||
          customerName.includes(
            searchValue
          ) ||
          paymentMethod.includes(
            searchValue
          )
        );
      }
    );


  const activeProducts =
    products.filter(
      (product) =>
        product.status ===
        "active"
    );


  const activeCustomers =
    customers.filter(
      (customer) =>
        customer.status ===
        "active"
    );


  const selectedCustomer =
    customers.find(
      (customer) =>
        customer._id ===
        formData.customer
    );


  return (
    <div className="sales-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="sales-header">

        <div>
          <h1>
            Sales / POS
          </h1>

          <p>
            Process supermarket sales and
            automatically update inventory.
          </p>
        </div>


        <button
          type="button"
          className="add-sale-btn"
          onClick={
            handleOpenModal
          }
        >
          <Plus size={18} />
          New Sale
        </button>

      </div>


      {/* =========================
          TOOLBAR
      ========================= */}

      <div className="sales-toolbar">

        <div className="search-box">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search sales..."
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


        <div className="sale-count">

          <ReceiptText
            size={18}
          />

          {sales.length} Sales

        </div>

      </div>


      {/* =========================
          LOADING
      ========================= */}

      {loading && (
        <div className="products-state">
          <p>
            Loading sales...
          </p>
        </div>
      )}


      {/* =========================
          ERROR
      ========================= */}

      {!loading &&
        error && (
          <div className="products-state error-state">

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={
                loadData
              }
            >
              Try Again
            </button>

          </div>
        )}


      {/* =========================
          EMPTY
      ========================= */}

      {!loading &&
        !error &&
        filteredSales.length ===
          0 && (

          <div className="products-state empty-state">

            <ShoppingBag
              size={42}
            />

            <h3>
              {sales.length ===
              0
                ? "No sales yet"
                : "No sales found"}
            </h3>

            <p>
              {sales.length ===
              0
                ? "Complete your first sale to get started."
                : "Try changing your search."}
            </p>

          </div>
        )}


      {/* =========================
          SALES HISTORY
      ========================= */}

      {!loading &&
        !error &&
        filteredSales.length >
          0 && (

          <div className="sales-table-container">

            <table className="sales-table">

              <thead>
                <tr>
                  <th>
                    Sale #
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Products
                  </th>

                  <th>
                    Subtotal
                  </th>

                  <th>
                    Discount
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

                  <th>
                    Status
                  </th>
                </tr>
              </thead>


              <tbody>

                {filteredSales.map(
                  (sale) => (

                    <tr
                      key={
                        sale._id
                      }
                    >

                      <td>

                        <span className="sale-number">
                          {
                            sale.saleNumber
                          }
                        </span>

                      </td>


                      <td>

                        <div className="sale-customer-cell">

                          <UserRound
                            size={15}
                          />

                          <span>
                            {sale.customerName ||
                              "Walk-in Customer"}
                          </span>

                        </div>

                      </td>


                      <td>

                        <div className="sale-products">

                          <Package
                            size={15}
                          />

                          {sale.items
                            ?.length ||
                            0}{" "}
                          item
                          {sale.items
                            ?.length !==
                          1
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
                            <Banknote
                              size={
                                14
                              }
                            />
                          ) : (
                            <CreditCard
                              size={
                                14
                              }
                            />
                          )}

                          {
                            sale.paymentMethod
                          }

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
                          {
                            sale.status
                          }
                        </span>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}


      {/* =========================
          POS MODAL
      ========================= */}

      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={
            handleCloseModal
          }
        >

          <div
            className="sale-modal"
            onMouseDown={
              (event) =>
                event.stopPropagation()
            }
          >

            {/* Modal Header */}

            <div className="modal-header">

              <div>

                <h2>
                  New Sale
                </h2>

                <p>
                  Add products and complete
                  customer checkout.
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={
                  handleCloseModal
                }
                disabled={
                  saving
                }
              >
                <X size={20} />
              </button>

            </div>


            <form
              className="product-form"
              onSubmit={
                handleSubmit
              }
            >

              {formError && (
                <div className="form-error">
                  {formError}
                </div>
              )}


              {/* =========================
                  SALE DETAILS
              ========================= */}

              <div className="form-grid">


                {/* Customer */}

                <div className="form-group">

                  <label>
                    Customer
                  </label>

                  <select
                    name="customer"
                    value={
                      formData.customer
                    }
                    onChange={
                      handleInputChange
                    }
                  >

                    <option value="">
                      Walk-in Customer
                    </option>

                    {activeCustomers.map(
                      (
                        customer
                      ) => (

                        <option
                          key={
                            customer._id
                          }
                          value={
                            customer._id
                          }
                        >
                          {
                            customer.name
                          }
                          {customer.phone
                            ? ` - ${customer.phone}`
                            : ""}
                        </option>

                      )
                    )}

                  </select>

                  {selectedCustomer && (

                    <small className="selected-customer-info">

                      {selectedCustomer.email ||
                        selectedCustomer.phone ||
                        "Registered customer"}

                    </small>

                  )}

                </div>


                {/* Payment */}

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


                {/* Sale Date */}

                <div className="form-group">

                  <label>
                    Sale Date
                  </label>

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
      

                {/* Discount */}

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


              {/* =========================
                  CART
              ========================= */}

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
                    onClick={
                      handleAddItem
                    }
                  >
                    <Plus size={16} />
                    Add Product
                  </button>

                </div>


                <div className="sale-items-list">

                  {items.map(
                    (
                      item,
                      index
                    ) => {

                      const selectedProduct =
                        getProduct(
                          item.product
                        );


                      return (

                        <div
                          className="sale-item-row"
                          key={
                            index
                          }
                        >

                          {/* Product */}

                          <div className="form-group sale-product-field">

                            <label>
                              Product
                            </label>

                            <select
                              value={
                                item.product
                              }
                              onChange={
                                (
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
                                    disabled={
                                      Number(
                                        product.quantity
                                      ) <=
                                      0
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


                          {/* Stock */}

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


                          {/* Price */}

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


                          {/* Quantity */}

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
                              onChange={
                                (
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


                          {/* Subtotal */}

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


                          {/* Remove */}

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
                              items.length ===
                              1
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


              {/* =========================
                  NOTES
              ========================= */}

              <div className="form-group full-width">

                <label>
                  Notes
                </label>

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


              {/* =========================
                  TOTALS
              ========================= */}

              <div className="sale-summary">

                <div>
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    Rs.{" "}
                    {subtotalAmount.toLocaleString()}
                  </strong>
                </div>


                <div>
                  <span>
                    Discount
                  </span>

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


              {/* =========================
                  FOOTER
              ========================= */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    handleCloseModal
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="save-product-btn"
                  disabled={
                    saving
                  }
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