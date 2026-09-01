import { useEffect, useMemo, useState } from "react";

import {
  RotateCcw,
  Search,
  ReceiptText,
  Package,
  UserRound,
  Banknote,
  CreditCard,
  X,
  CheckCircle2,
} from "lucide-react";

import {
  getReturns,
  getReturnableSale,
  createReturn,
} from "../services/returnService";

import {
  getSales,
} from "../services/saleService";


function Returns() {
  const [returns, setReturns] = useState([]);
  const [sales, setSales] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [selectedSaleId, setSelectedSaleId] = useState("");
  const [returnableData, setReturnableData] = useState(null);
  const [loadingSale, setLoadingSale] = useState(false);

  const [returnItems, setReturnItems] = useState([]);

  const [refundMethod, setRefundMethod] = useState("cash");
  const [reason, setReason] = useState("");


  // =========================
  // LOAD RETURNS
  // =========================

  const fetchReturns = async () => {
    const result = await getReturns();

    setReturns(result.data || []);
  };


  // =========================
  // LOAD SALES
  // =========================

  const fetchSales = async () => {
    const result = await getSales();

    setSales(result.data || []);
  };


  // =========================
  // LOAD PAGE DATA
  // =========================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchReturns(),
        fetchSales(),
      ]);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load returns information."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
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
  // OPEN MODAL
  // =========================

  const openReturnModal = () => {
    setSelectedSaleId("");
    setReturnableData(null);
    setReturnItems([]);
    setRefundMethod("cash");
    setReason("");
    setFormError("");
    setShowModal(true);
  };


  // =========================
  // CLOSE MODAL
  // =========================

  const closeReturnModal = () => {
    if (saving) return;

    setShowModal(false);
    setSelectedSaleId("");
    setReturnableData(null);
    setReturnItems([]);
    setReason("");
    setFormError("");
  };


  // =========================
  // SELECT SALE
  // =========================

  const handleSaleChange = async (event) => {
    const saleId = event.target.value;

    setSelectedSaleId(saleId);
    setReturnableData(null);
    setReturnItems([]);
    setFormError("");

    if (!saleId) {
      return;
    }

    try {
      setLoadingSale(true);

      const result =
        await getReturnableSale(saleId);

      setReturnableData(result.data);

      setRefundMethod(
        result.data?.sale?.paymentMethod ||
          "cash"
      );

      setReturnItems(
        (result.data?.items || []).map((item) => ({
          product:
            item.product?._id ||
            item.product,

          productName:
            item.productName,

          sku:
            item.sku,

          soldQuantity:
            item.soldQuantity,

          returnedQuantity:
            item.returnedQuantity,

          returnableQuantity:
            item.returnableQuantity,

          sellingPrice:
            item.sellingPrice,

          quantity: 0,
        }))
      );

    } catch (err) {
      console.error(err);

      setFormError(
        err.response?.data?.message ||
          "Unable to load returnable sale."
      );
    } finally {
      setLoadingSale(false);
    }
  };


  // =========================
  // RETURN QUANTITY CHANGE
  // =========================

  const handleReturnQuantityChange = (
    index,
    value
  ) => {
    setReturnItems((currentItems) => {
      const updated = [...currentItems];

      const maxQuantity =
        Number(
          updated[index].returnableQuantity
        ) || 0;

      let quantity =
        Number(value);

      if (
        !Number.isFinite(quantity) ||
        quantity < 0
      ) {
        quantity = 0;
      }

      if (
        quantity >
        maxQuantity
      ) {
        quantity = maxQuantity;
      }

      updated[index] = {
        ...updated[index],
        quantity,
      };

      return updated;
    });
  };


  // =========================
  // REFUND TOTAL
  // =========================

  const totalRefund = useMemo(() => {
    return returnItems.reduce(
      (total, item) => {
        return (
          total +
          Number(item.quantity || 0) *
            Number(item.sellingPrice || 0)
        );
      },
      0
    );
  }, [returnItems]);


  // =========================
  // PROCESS RETURN
  // =========================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!selectedSaleId) {
      setFormError(
        "Please select a sale."
      );

      return;
    }


    const selectedItems =
      returnItems.filter(
        (item) =>
          Number(item.quantity) > 0
      );


    if (
      selectedItems.length === 0
    ) {
      setFormError(
        "Enter a return quantity for at least one product."
      );

      return;
    }


    for (
      const item of selectedItems
    ) {
      const quantity =
        Number(item.quantity);


      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        setFormError(
          "Return quantity must be a positive whole number."
        );

        return;
      }


      if (
        quantity >
        Number(
          item.returnableQuantity
        )
      ) {
        setFormError(
          `Only ${item.returnableQuantity} unit(s) of ${item.productName} can be returned.`
        );

        return;
      }
    }


    try {
      setSaving(true);


      const payload = {
        sale:
          selectedSaleId,

        items:
          selectedItems.map(
            (item) => ({
              product:
                item.product,

              quantity:
                Number(
                  item.quantity
                ),
            })
          ),

        refundMethod,

        reason:
          reason.trim(),
      };


      const result =
        await createReturn(
          payload
        );


      setReturns(
        (currentReturns) => [
          result.data,
          ...currentReturns,
        ]
      );


      showSuccess(
        "Return completed successfully"
      );


      setShowModal(false);

      setSelectedSaleId("");
      setReturnableData(null);
      setReturnItems([]);
      setReason("");


      // Refresh because returnable
      // quantities may have changed
      await fetchSales();

    } catch (err) {
      console.error(err);

      setFormError(
        err.response?.data?.message ||
          "Unable to process return."
      );
    } finally {
      setSaving(false);
    }
  };


  // =========================
  // SEARCH RETURN HISTORY
  // =========================

  const filteredReturns =
    returns.filter(
      (returnRecord) => {

        const text =
          search
            .toLowerCase()
            .trim();


        const returnNumber =
          returnRecord.returnNumber
            ?.toLowerCase() ||
          "";


        const saleNumber =
          returnRecord.saleNumber
            ?.toLowerCase() ||
          "";


        const customerName =
          returnRecord.customerName
            ?.toLowerCase() ||
          "";


        const reasonText =
          returnRecord.reason
            ?.toLowerCase() ||
          "";


        return (
          returnNumber.includes(text) ||
          saleNumber.includes(text) ||
          customerName.includes(text) ||
          reasonText.includes(text)
        );
      }
    );


  const completedSales =
    sales.filter(
      (sale) =>
        sale.status ===
        "completed"
    );


  return (
    <div className="returns-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="sales-header">

        <div>
          <h1>
            Returns & Refunds
          </h1>

          <p>
            Process product returns,
            restore inventory and track
            customer refunds.
          </p>
        </div>


        <button
          type="button"
          className="add-sale-btn"
          onClick={
            openReturnModal
          }
        >
          <RotateCcw size={18} />
          New Return
        </button>

      </div>


      {/* =========================
          SUCCESS / ERROR
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
            Total Returns
          </span>

          <strong>
            {returns.length}
          </strong>

        </div>


        <div className="summary-card">

          <span>
            Total Refunded
          </span>

          <strong>
            Rs.{" "}
            {returns
              .reduce(
                (
                  total,
                  item
                ) =>
                  total +
                  Number(
                    item.totalRefund ||
                      0
                  ),
                0
              )
              .toLocaleString()}
          </strong>

        </div>


        <div className="summary-card">

          <span>
            Returned Items
          </span>

          <strong>
            {returns.reduce(
              (
                total,
                returnRecord
              ) =>
                total +
                (
                  returnRecord.items ||
                  []
                ).reduce(
                  (
                    itemTotal,
                    item
                  ) =>
                    itemTotal +
                    Number(
                      item.quantity ||
                        0
                    ),
                  0
                ),
              0
            )}
          </strong>

        </div>

      </div>


      {/* =========================
          TOOLBAR
      ========================= */}

      <div className="sales-toolbar">

        <div className="search-box">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search returns..."
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

          {returns.length} Returns

        </div>

      </div>


      {/* =========================
          LOADING
      ========================= */}

      {loading && (
        <div className="products-state">
          <p>
            Loading returns...
          </p>
        </div>
      )}


      {/* =========================
          EMPTY
      ========================= */}

      {!loading &&
        !error &&
        filteredReturns.length ===
          0 && (

          <div className="products-state empty-state">

            <RotateCcw
              size={42}
            />

            <h3>
              {returns.length ===
              0
                ? "No returns yet"
                : "No returns found"}
            </h3>

            <p>
              {returns.length ===
              0
                ? "Processed returns will appear here."
                : "Try changing your search."}
            </p>

          </div>
        )}


      {/* =========================
          RETURN HISTORY TABLE
      ========================= */}

      {!loading &&
        !error &&
        filteredReturns.length >
          0 && (

          <div className="sales-table-container">

            <table className="sales-table">

              <thead>

                <tr>
                  <th>
                    Return #
                  </th>

                  <th>
                    Sale #
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Items
                  </th>

                  <th>
                    Refund
                  </th>

                  <th>
                    Method
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Processed By
                  </th>

                  <th>
                    Status
                  </th>
                </tr>

              </thead>


              <tbody>

                {filteredReturns.map(
                  (
                    returnRecord
                  ) => (

                    <tr
                      key={
                        returnRecord._id
                      }
                    >

                      <td>

                        <span className="sale-number">
                          {
                            returnRecord.returnNumber
                          }
                        </span>

                      </td>


                      <td>
                        {
                          returnRecord.saleNumber
                        }
                      </td>


                      <td>

                        <div className="sale-customer-cell">

                          <UserRound
                            size={15}
                          />

                          {
                            returnRecord.customerName ||
                            "Walk-in Customer"
                          }

                        </div>

                      </td>


                      <td>

                        <div className="sale-products">

                          <Package
                            size={15}
                          />

                          {returnRecord.items
                            ?.reduce(
                              (
                                total,
                                item
                              ) =>
                                total +
                                Number(
                                  item.quantity ||
                                    0
                                ),
                              0
                            ) || 0}{" "}
                          item(s)

                        </div>

                      </td>


                      <td>

                        <strong>
                          Rs.{" "}
                          {Number(
                            returnRecord.totalRefund ||
                              0
                          ).toLocaleString()}
                        </strong>

                      </td>


                      <td>

                        <span className="payment-method">

                          {returnRecord.refundMethod ===
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
                            returnRecord.refundMethod
                          }

                        </span>

                      </td>


                      <td>

                        {new Date(
                          returnRecord.returnDate
                        ).toLocaleDateString()}

                      </td>


                      <td>
                        {returnRecord
                          .processedBy
                          ?.name ||
                          "-"}
                      </td>


                      <td>

                        <span className="status status-active">

                          <CheckCircle2
                            size={13}
                          />

                          {
                            returnRecord.status
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
          NEW RETURN MODAL
      ========================= */}

      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={
            closeReturnModal
          }
        >

          <div
            className="sale-modal return-modal"
            onMouseDown={
              (event) =>
                event.stopPropagation()
            }
          >

            {/* Header */}

            <div className="modal-header">

              <div>

                <h2>
                  New Return
                </h2>

                <p>
                  Select an original sale
                  and choose products to
                  return.
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={
                  closeReturnModal
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
                  SALE SELECTOR
              ========================= */}

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Original Sale
                  </label>

                  <select
                    value={
                      selectedSaleId
                    }
                    onChange={
                      handleSaleChange
                    }
                  >

                    <option value="">
                      Select sale
                    </option>


                    {completedSales.map(
                      (sale) => (

                        <option
                          key={
                            sale._id
                          }
                          value={
                            sale._id
                          }
                        >
                          {
                            sale.saleNumber
                          }
                          {" - "}
                          {sale.customerName ||
                            "Walk-in Customer"}
                          {" - Rs. "}
                          {Number(
                            sale.totalAmount ||
                              0
                          ).toLocaleString()}
                        </option>

                      )
                    )}

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Refund Method
                  </label>

                  <select
                    value={
                      refundMethod
                    }
                    onChange={
                      (event) =>
                        setRefundMethod(
                          event.target
                            .value
                        )
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


              {/* =========================
                  LOADING SALE
              ========================= */}

              {loadingSale && (

                <div className="return-loading">

                  Loading sale items...

                </div>

              )}


              {/* =========================
                  SELECTED SALE INFO
              ========================= */}

              {!loadingSale &&
                returnableData && (

                  <div className="return-sale-info">

                    <div>

                      <span>
                        Sale
                      </span>

                      <strong>
                        {
                          returnableData
                            .sale
                            .saleNumber
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Customer
                      </span>

                      <strong>
                        {
                          returnableData
                            .sale
                            .customerName
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Original Total
                      </span>

                      <strong>
                        Rs.{" "}
                        {Number(
                          returnableData
                            .sale
                            .totalAmount
                        ).toLocaleString()}
                      </strong>

                    </div>

                  </div>

                )}


              {/* =========================
                  RETURN ITEMS
              ========================= */}

              {!loadingSale &&
                returnItems.length >
                  0 && (

                  <div className="sale-items-section">

                    <div className="sale-items-header">

                      <div>

                        <h3>
                          Return Items
                        </h3>

                        <p>
                          Enter quantity to
                          return.
                        </p>

                      </div>

                    </div>


                    <div className="return-items-list">

                      {returnItems.map(
                        (
                          item,
                          index
                        ) => (

                          <div
                            className="return-item-row"
                            key={
                              item.product
                            }
                          >

                            <div className="return-product-info">

                              <strong>
                                {
                                  item.productName
                                }
                              </strong>

                              <span>
                                {
                                  item.sku
                                }
                              </span>

                            </div>


                            <div className="return-detail">

                              <span>
                                Sold
                              </span>

                              <strong>
                                {
                                  item.soldQuantity
                                }
                              </strong>

                            </div>


                            <div className="return-detail">

                              <span>
                                Returned
                              </span>

                              <strong>
                                {
                                  item.returnedQuantity
                                }
                              </strong>

                            </div>


                            <div className="return-detail">

                              <span>
                                Available
                              </span>

                              <strong>
                                {
                                  item.returnableQuantity
                                }
                              </strong>

                            </div>


                            <div className="return-detail">

                              <span>
                                Price
                              </span>

                              <strong>
                                Rs.{" "}
                                {Number(
                                  item.sellingPrice
                                ).toLocaleString()}
                              </strong>

                            </div>


                            <div className="form-group return-quantity-field">

                              <label>
                                Return Qty
                              </label>

                              <input
                                type="number"
                                min="0"
                                step="1"
                                max={
                                  item.returnableQuantity
                                }
                                value={
                                  item.quantity
                                }
                                disabled={
                                  Number(
                                    item.returnableQuantity
                                  ) <=
                                  0
                                }
                                onChange={
                                  (
                                    event
                                  ) =>
                                    handleReturnQuantityChange(
                                      index,
                                      event
                                        .target
                                        .value
                                    )
                                }
                              />

                            </div>


                            <div className="return-detail">

                              <span>
                                Refund
                              </span>

                              <strong>
                                Rs.{" "}
                                {(
                                  Number(
                                    item.quantity ||
                                      0
                                  ) *
                                  Number(
                                    item.sellingPrice ||
                                      0
                                  )
                                ).toLocaleString()}
                              </strong>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  </div>

                )}


              {/* =========================
                  REASON
              ========================= */}

              <div className="form-group full-width">

                <label>
                  Return Reason
                </label>

                <textarea
                  value={reason}
                  onChange={
                    (event) =>
                      setReason(
                        event.target
                          .value
                      )
                  }
                  rows="3"
                  placeholder="e.g. Damaged product, wrong item, customer changed mind..."
                />

              </div>


              {/* =========================
                  REFUND SUMMARY
              ========================= */}

              <div className="sale-summary">

                <div className="sale-grand-total">

                  <span>
                    Refund Total
                  </span>

                  <strong>
                    Rs.{" "}
                    {totalRefund.toLocaleString()}
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
                    closeReturnModal
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
                    saving ||
                    totalRefund <= 0
                  }
                >

                  {saving
                    ? "Processing Return..."
                    : "Complete Return"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


export default Returns;