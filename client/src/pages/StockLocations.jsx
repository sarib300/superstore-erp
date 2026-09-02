import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Warehouse,
  Store,
  MonitorDot,
  MapPin,
  Package,
  Boxes,
  ArrowRightLeft,
  Plus,
  Search,
  RefreshCw,
  X,
  Eye,
} from "lucide-react";

import {
  getStockLocations,
  createStockLocation,
  getLocationStock,
  getStockTransfers,
  createStockTransfer,
  syncExistingStock,
} from "../services/stockLocationService";

import {
  getProducts,
} from "../services/productService";

import "./StockLocations.css";


const initialLocationForm = {
  name: "",
  code: "",
  type: "warehouse",
  address: "",
  description: "",
  status: "active",
};


const getInitialTransferForm = () => ({
  product: "",
  fromLocation: "",
  toLocation: "",
  quantity: "",
  transferDate:
    new Date()
      .toISOString()
      .split("T")[0],
  notes: "",
});


function StockLocations() {
  const [
    locations,
    setLocations,
  ] = useState([]);

  const [
    transfers,
    setTransfers,
  ] = useState([]);

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    showLocationModal,
    setShowLocationModal,
  ] = useState(false);

  const [
    showTransferModal,
    setShowTransferModal,
  ] = useState(false);

  const [
    showStockModal,
    setShowStockModal,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    locationForm,
    setLocationForm,
  ] = useState(
    initialLocationForm
  );

  const [
    transferForm,
    setTransferForm,
  ] = useState(
    getInitialTransferForm()
  );

  const [
    selectedLocationStock,
    setSelectedLocationStock,
  ] = useState(null);

  const [
    stockLoading,
    setStockLoading,
  ] = useState(false);


  const showSuccess = (text) => {
    setMessage(text);
    setError("");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };


  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        locationResult,
        transferResult,
        productResult,
      ] = await Promise.all([
        getStockLocations(),
        getStockTransfers(),
        getProducts(),
      ]);

      setLocations(
        locationResult.data || []
      );

      setTransfers(
        transferResult.data || []
      );

      setProducts(
        productResult.data || []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load stock locations."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);


  const filteredLocations =
    locations.filter(
      (location) => {
        const value =
          search
            .toLowerCase()
            .trim();

        return (
          location.name
            ?.toLowerCase()
            .includes(value) ||
          location.code
            ?.toLowerCase()
            .includes(value) ||
          location.type
            ?.toLowerCase()
            .includes(value)
        );
      }
    );


  const totalUnits =
    locations.reduce(
      (total, location) =>
        total +
        Number(
          location.totalUnits ||
            0
        ),
      0
    );


  const activeLocations =
    locations.filter(
      (location) =>
        location.status ===
        "active"
    );


  const activeProducts =
    products.filter(
      (product) =>
        product.status ===
        "active"
    );


  const selectedTransferProduct =
    useMemo(
      () =>
        products.find(
          (product) =>
            product._id ===
            transferForm.product
        ),
      [
        products,
        transferForm.product,
      ]
    );


  const openLocationModal = () => {
    setLocationForm(
      initialLocationForm
    );

    setFormError("");
    setShowLocationModal(true);
  };


  const openTransferModal = () => {
    setTransferForm(
      getInitialTransferForm()
    );

    setFormError("");
    setShowTransferModal(true);
  };


  const handleLocationChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setLocationForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  };


  const handleTransferChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setTransferForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  };


  const handleCreateLocation =
    async (event) => {
      event.preventDefault();

      setFormError("");

      if (
        !locationForm.name.trim() ||
        !locationForm.code.trim()
      ) {
        setFormError(
          "Location name and code are required."
        );

        return;
      }

      try {
        setSaving(true);

        await createStockLocation({
          ...locationForm,
          name:
            locationForm.name.trim(),
          code:
            locationForm.code
              .trim()
              .toUpperCase(),
          address:
            locationForm.address.trim(),
          description:
            locationForm.description.trim(),
        });

        setShowLocationModal(false);

        showSuccess(
          "Stock location created successfully"
        );

        await loadData();
      } catch (err) {
        setFormError(
          err.response?.data?.message ||
            "Unable to create stock location."
        );
      } finally {
        setSaving(false);
      }
    };


  const handleCreateTransfer =
    async (event) => {
      event.preventDefault();

      setFormError("");

      const amount =
        Number(
          transferForm.quantity
        );

      if (
        !transferForm.product ||
        !transferForm.fromLocation ||
        !transferForm.toLocation
      ) {
        setFormError(
          "Select product, from location and to location."
        );

        return;
      }

      if (
        transferForm.fromLocation ===
        transferForm.toLocation
      ) {
        setFormError(
          "From and to locations must be different."
        );

        return;
      }

      if (
        !Number.isInteger(amount) ||
        amount <= 0
      ) {
        setFormError(
          "Quantity must be a positive whole number."
        );

        return;
      }

      try {
        setSaving(true);

        await createStockTransfer({
          ...transferForm,
          quantity:
            amount,
          notes:
            transferForm.notes.trim(),
        });

        setShowTransferModal(false);

        showSuccess(
          "Stock transferred successfully"
        );

        await loadData();
      } catch (err) {
        setFormError(
          err.response?.data?.message ||
            "Unable to transfer stock."
        );
      } finally {
        setSaving(false);
      }
    };


  const handleSync = async () => {
    const confirmed =
      window.confirm(
        "Synchronize current product quantities with stock locations? Existing unallocated stock will be placed in Main Warehouse."
      );

    if (!confirmed) return;

    try {
      setSaving(true);

      const result =
        await syncExistingStock();

      showSuccess(
        result.message ||
          "Stock synchronized successfully"
      );

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to synchronize stock."
      );
    } finally {
      setSaving(false);
    }
  };


  const openLocationStock =
    async (location) => {
      try {
        setStockLoading(true);
        setSelectedLocationStock(
          null
        );
        setShowStockModal(true);

        const result =
          await getLocationStock(
            location._id
          );

        setSelectedLocationStock(
          result.data
        );
      } catch (err) {
        setSelectedLocationStock({
          error:
            err.response?.data?.message ||
            "Unable to load location stock.",
        });
      } finally {
        setStockLoading(false);
      }
    };


  const getLocationIcon = (
    type
  ) => {
    if (type === "store") {
      return <Store size={19} />;
    }

    if (type === "counter") {
      return (
        <MonitorDot size={19} />
      );
    }

    return <Warehouse size={19} />;
  };


  if (loading) {
    return (
      <div className="stock-locations-page">
        <div className="stock-page-state">
          Loading stock locations...
        </div>
      </div>
    );
  }


  return (
    <div className="stock-locations-page">

      <div className="stock-page-header">
        <div>
          <h1>
            <Warehouse size={28} />
            Stock Locations
          </h1>

          <p>
            Track where inventory is physically stored
            and move stock between locations.
          </p>
        </div>

        <div className="stock-header-actions">
          <button
            type="button"
            className="stock-secondary-btn"
            onClick={handleSync}
            disabled={saving}
          >
            <RefreshCw size={17} />
            Sync Existing Stock
          </button>

          <button
            type="button"
            className="stock-secondary-btn"
            onClick={
              openLocationModal
            }
          >
            <Plus size={17} />
            Add Location
          </button>

          <button
            type="button"
            className="stock-primary-btn"
            onClick={
              openTransferModal
            }
          >
            <ArrowRightLeft
              size={17}
            />
            Transfer Stock
          </button>
        </div>
      </div>


      {message && (
        <div className="stock-success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="stock-error-message">
          {error}
        </div>
      )}


      <div className="stock-summary-grid">
        <div className="stock-summary-card">
          <span>
            Total Locations
          </span>

          <strong>
            {locations.length}
          </strong>

          <small>
            Physical inventory points
          </small>
        </div>

        <div className="stock-summary-card">
          <span>
            Active Locations
          </span>

          <strong>
            {activeLocations.length}
          </strong>

          <small>
            Available for transfers
          </small>
        </div>

        <div className="stock-summary-card">
          <span>
            Located Units
          </span>

          <strong>
            {totalUnits.toLocaleString()}
          </strong>

          <small>
            Sum across all locations
          </small>
        </div>

        <div className="stock-summary-card">
          <span>
            Transfers
          </span>

          <strong>
            {transfers.length}
          </strong>

          <small>
            Completed internal moves
          </small>
        </div>
      </div>


      <div className="stock-section-card">
        <div className="stock-toolbar">
          <div className="stock-search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search locations..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <span className="stock-location-count">
            {filteredLocations.length} Locations
          </span>
        </div>


        <div className="stock-location-grid">
          {filteredLocations.map(
            (location) => (
              <div
                className="stock-location-card"
                key={location._id}
              >
                <div className="stock-location-top">
                  <div className="stock-location-icon">
                    {getLocationIcon(
                      location.type
                    )}
                  </div>

                  <div className="stock-location-title">
                    <strong>
                      {location.name}
                    </strong>

                    <span>
                      {location.code}
                    </span>
                  </div>

                  <span
                    className={`stock-status ${
                      location.status ===
                      "active"
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {location.status}
                  </span>
                </div>

                <div className="stock-location-type">
                  {location.type}
                </div>

                {location.address && (
                  <div className="stock-location-address">
                    <MapPin size={14} />
                    {location.address}
                  </div>
                )}

                <div className="stock-location-stats">
                  <div>
                    <Package
                      size={17}
                    />

                    <span>
                      Products
                    </span>

                    <strong>
                      {location.productCount ||
                        0}
                    </strong>
                  </div>

                  <div>
                    <Boxes size={17} />

                    <span>
                      Units
                    </span>

                    <strong>
                      {Number(
                        location.totalUnits ||
                          0
                      ).toLocaleString()}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="stock-view-btn"
                  onClick={() =>
                    openLocationStock(
                      location
                    )
                  }
                >
                  <Eye size={16} />
                  View Stock
                </button>
              </div>
            )
          )}
        </div>
      </div>


      <div className="stock-section-card">
        <div className="stock-section-heading">
          <div>
            <h2>
              Recent Stock Transfers
            </h2>

            <p>
              Internal movement history. Transfers do
              not change total company inventory.
            </p>
          </div>
        </div>

        <div className="stock-table-wrap">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Transfer #</th>
                <th>Product</th>
                <th>From</th>
                <th>To</th>
                <th>Quantity</th>
                <th>Date</th>
                <th>Processed By</th>
              </tr>
            </thead>

            <tbody>
              {transfers.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="stock-empty-cell"
                  >
                    No stock transfers yet.
                  </td>
                </tr>
              ) : (
                transfers
                  .slice(0, 10)
                  .map(
                    (transfer) => (
                      <tr
                        key={
                          transfer._id
                        }
                      >
                        <td>
                          <strong className="stock-transfer-number">
                            {
                              transfer.transferNumber
                            }
                          </strong>
                        </td>

                        <td>
                          {
                            transfer.productName
                          }
                          <small className="stock-table-subtext">
                            {
                              transfer.sku
                            }
                          </small>
                        </td>

                        <td>
                          {
                            transfer.fromLocation
                              ?.name
                          }
                        </td>

                        <td>
                          {
                            transfer.toLocation
                              ?.name
                          }
                        </td>

                        <td>
                          <strong>
                            {
                              transfer.quantity
                            }
                          </strong>
                        </td>

                        <td>
                          {new Date(
                            transfer.transferDate
                          ).toLocaleDateString()}
                        </td>

                        <td>
                          {transfer.processedBy
                            ?.name ||
                            "-"}
                        </td>
                      </tr>
                    )
                  )
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* ADD LOCATION MODAL */}
      {showLocationModal && (
        <div
          className="stock-modal-overlay"
          onMouseDown={() =>
            !saving &&
            setShowLocationModal(
              false
            )
          }
        >
          <div
            className="stock-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="stock-modal-header">
              <div>
                <h2>
                  Add Stock Location
                </h2>

                <p>
                  Create a warehouse, store or counter location.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowLocationModal(
                    false
                  )
                }
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                handleCreateLocation
              }
              className="stock-modal-body"
            >
              {formError && (
                <div className="stock-form-error">
                  {formError}
                </div>
              )}

              <div className="stock-form-grid">
                <div className="stock-form-group">
                  <label>
                    Location Name *
                  </label>

                  <input
                    name="name"
                    value={
                      locationForm.name
                    }
                    onChange={
                      handleLocationChange
                    }
                    placeholder="e.g. Islamabad Warehouse"
                  />
                </div>

                <div className="stock-form-group">
                  <label>
                    Location Code *
                  </label>

                  <input
                    name="code"
                    value={
                      locationForm.code
                    }
                    onChange={
                      handleLocationChange
                    }
                    placeholder="e.g. ISB-WH"
                  />
                </div>

                <div className="stock-form-group">
                  <label>Type</label>

                  <select
                    name="type"
                    value={
                      locationForm.type
                    }
                    onChange={
                      handleLocationChange
                    }
                  >
                    <option value="warehouse">
                      Warehouse
                    </option>
                    <option value="store">
                      Store
                    </option>
                    <option value="counter">
                      Counter
                    </option>
                    <option value="other">
                      Other
                    </option>
                  </select>
                </div>

                <div className="stock-form-group">
                  <label>Status</label>

                  <select
                    name="status"
                    value={
                      locationForm.status
                    }
                    onChange={
                      handleLocationChange
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

              <div className="stock-form-group">
                <label>Address</label>

                <input
                  name="address"
                  value={
                    locationForm.address
                  }
                  onChange={
                    handleLocationChange
                  }
                  placeholder="Optional location address"
                />
              </div>

              <div className="stock-form-group">
                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    locationForm.description
                  }
                  onChange={
                    handleLocationChange
                  }
                  rows="3"
                  placeholder="Optional notes about this location"
                />
              </div>

              <div className="stock-modal-footer">
                <button
                  type="button"
                  className="stock-cancel-btn"
                  onClick={() =>
                    setShowLocationModal(
                      false
                    )
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="stock-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Create Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* TRANSFER MODAL */}
      {showTransferModal && (
        <div
          className="stock-modal-overlay"
          onMouseDown={() =>
            !saving &&
            setShowTransferModal(
              false
            )
          }
        >
          <div
            className="stock-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="stock-modal-header">
              <div>
                <h2>
                  Transfer Stock
                </h2>

                <p>
                  Move inventory between physical locations.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowTransferModal(
                    false
                  )
                }
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                handleCreateTransfer
              }
              className="stock-modal-body"
            >
              {formError && (
                <div className="stock-form-error">
                  {formError}
                </div>
              )}

              <div className="stock-form-group">
                <label>Product *</label>

                <select
                  name="product"
                  value={
                    transferForm.product
                  }
                  onChange={
                    handleTransferChange
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
                      >
                        {product.name} (
                        {product.sku}) - Total:{" "}
                        {product.quantity}
                      </option>
                    )
                  )}
                </select>

                {selectedTransferProduct && (
                  <small className="stock-help-text">
                    Consolidated stock:{" "}
                    {
                      selectedTransferProduct.quantity
                    }{" "}
                    {
                      selectedTransferProduct.unit
                    }
                  </small>
                )}
              </div>

              <div className="stock-form-grid">
                <div className="stock-form-group">
                  <label>
                    From Location *
                  </label>

                  <select
                    name="fromLocation"
                    value={
                      transferForm.fromLocation
                    }
                    onChange={
                      handleTransferChange
                    }
                  >
                    <option value="">
                      Select source
                    </option>

                    {activeLocations.map(
                      (location) => (
                        <option
                          key={
                            location._id
                          }
                          value={
                            location._id
                          }
                        >
                          {location.name} (
                          {location.code})
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="stock-form-group">
                  <label>
                    To Location *
                  </label>

                  <select
                    name="toLocation"
                    value={
                      transferForm.toLocation
                    }
                    onChange={
                      handleTransferChange
                    }
                  >
                    <option value="">
                      Select destination
                    </option>

                    {activeLocations.map(
                      (location) => (
                        <option
                          key={
                            location._id
                          }
                          value={
                            location._id
                          }
                        >
                          {location.name} (
                          {location.code})
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="stock-form-group">
                  <label>
                    Quantity *
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    name="quantity"
                    value={
                      transferForm.quantity
                    }
                    onChange={
                      handleTransferChange
                    }
                    placeholder="0"
                  />
                </div>

                <div className="stock-form-group">
                  <label>
                    Transfer Date
                  </label>

                  <input
                    type="date"
                    name="transferDate"
                    value={
                      transferForm.transferDate
                    }
                    onChange={
                      handleTransferChange
                    }
                  />
                </div>
              </div>

              <div className="stock-form-group">
                <label>Notes</label>

                <textarea
                  name="notes"
                  value={
                    transferForm.notes
                  }
                  onChange={
                    handleTransferChange
                  }
                  rows="3"
                  placeholder="e.g. Restock retail floor"
                />
              </div>

              <div className="stock-modal-footer">
                <button
                  type="button"
                  className="stock-cancel-btn"
                  onClick={() =>
                    setShowTransferModal(
                      false
                    )
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="stock-primary-btn"
                  disabled={saving}
                >
                  <ArrowRightLeft
                    size={16}
                  />
                  {saving
                    ? "Transferring..."
                    : "Transfer Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* VIEW LOCATION STOCK MODAL */}
      {showStockModal && (
        <div
          className="stock-modal-overlay"
          onMouseDown={() =>
            setShowStockModal(false)
          }
        >
          <div
            className="stock-modal stock-view-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="stock-modal-header">
              <div>
                <h2>
                  Location Stock
                </h2>

                <p>
                  Product quantities stored at this location.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowStockModal(
                    false
                  )
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="stock-view-content">
              {stockLoading ? (
                <div className="stock-page-state">
                  Loading stock...
                </div>
              ) : selectedLocationStock?.error ? (
                <div className="stock-form-error">
                  {
                    selectedLocationStock.error
                  }
                </div>
              ) : (
                <>
                  <div className="stock-view-location-title">
                    <strong>
                      {
                        selectedLocationStock
                          ?.location
                          ?.name
                      }
                    </strong>

                    <span>
                      {
                        selectedLocationStock
                          ?.location
                          ?.code
                      }
                    </span>
                  </div>

                  <div className="stock-table-wrap">
                    <table className="stock-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Category</th>
                          <th>Quantity</th>
                        </tr>
                      </thead>

                      <tbody>
                        {(selectedLocationStock
                          ?.stock ||
                          []).length ===
                        0 ? (
                          <tr>
                            <td
                              colSpan="4"
                              className="stock-empty-cell"
                            >
                              No stock at this location.
                            </td>
                          </tr>
                        ) : (
                          selectedLocationStock.stock.map(
                            (row) => (
                              <tr
                                key={
                                  row._id
                                }
                              >
                                <td>
                                  <strong>
                                    {
                                      row.product
                                        ?.name
                                    }
                                  </strong>
                                </td>

                                <td>
                                  {
                                    row.product
                                      ?.sku
                                  }
                                </td>

                                <td>
                                  {
                                    row.product
                                      ?.category
                                  }
                                </td>

                                <td>
                                  <strong>
                                    {
                                      row.quantity
                                    }{" "}
                                    {
                                      row.product
                                        ?.unit ||
                                      "pcs"
                                    }
                                  </strong>
                                </td>
                              </tr>
                            )
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


export default StockLocations;
