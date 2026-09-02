const Product = require("../models/Product");
const StockLocation = require("../models/StockLocation");
const LocationStock = require("../models/LocationStock");

const SYSTEM_LOCATIONS = {
  warehouse: {
    name: "Main Warehouse",
    code: "MAIN-WH",
    type: "warehouse",
    description: "Primary receiving and bulk inventory location",
  },

  store: {
    name: "Main Store",
    code: "MAIN-STORE",
    type: "store",
    description: "Main retail floor / store inventory",
  },

  counter: {
    name: "POS Counter",
    code: "POS-01",
    type: "counter",
    description: "Point-of-sale counter stock location",
  },
};


const ensureSystemLocations = async () => {
  const result = {};

  for (const [key, location] of Object.entries(
    SYSTEM_LOCATIONS
  )) {
    result[key] =
      await StockLocation.findOneAndUpdate(
        {
          code: location.code,
        },
        {
          $setOnInsert: {
            ...location,
            status: "active",
            systemLocation: true,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );
  }

  return result;
};


const getProductLocationTotal = async (
  productId
) => {
  const result = await LocationStock.aggregate([
    {
      $match: {
        product:
          new (require("mongoose").Types.ObjectId)(
            productId
          ),
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$quantity",
        },
      },
    },
  ]);

  return Number(result[0]?.total || 0);
};


const addToLocation = async (
  productId,
  locationId,
  quantity
) => {
  const amount = Number(quantity);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(
      "Location stock increase must be greater than 0"
    );
  }

  return LocationStock.findOneAndUpdate(
    {
      product: productId,
      location: locationId,
    },
    {
      $inc: {
        quantity: amount,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
};


const decreaseSingleLocation = async (
  productId,
  locationId,
  quantity
) => {
  const amount = Number(quantity);

  const stock =
    await LocationStock.findOneAndUpdate(
      {
        product: productId,
        location: locationId,
        quantity: {
          $gte: amount,
        },
      },
      {
        $inc: {
          quantity: -amount,
        },
      },
      {
        new: true,
      }
    );

  if (!stock) {
    throw new Error(
      "Insufficient stock at the selected location"
    );
  }

  return stock;
};


const getPriority = (location) => {
  const code = location?.code || "";

  if (code === "MAIN-STORE") return 1;
  if (code === "POS-01") return 2;
  if (code === "MAIN-WH") return 3;

  return 10;
};


const deductFromLocations = async (
  productId,
  quantity
) => {
  const amount = Number(quantity);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(
      "Location stock deduction must be greater than 0"
    );
  }

  const stocks =
    await LocationStock.find({
      product: productId,
      quantity: {
        $gt: 0,
      },
    }).populate(
      "location",
      "name code type status"
    );

  stocks.sort(
    (a, b) =>
      getPriority(a.location) -
      getPriority(b.location)
  );

  const available = stocks.reduce(
    (total, stock) =>
      total + Number(stock.quantity || 0),
    0
  );

  if (available < amount) {
    throw new Error(
      `Location stock is insufficient. Only ${available} unit(s) are allocated.`
    );
  }

  let remaining = amount;
  const applied = [];

  try {
    for (const stock of stocks) {
      if (remaining <= 0) break;

      const take = Math.min(
        remaining,
        Number(stock.quantity)
      );

      if (take <= 0) continue;

      const updated =
        await LocationStock.findOneAndUpdate(
          {
            _id: stock._id,
            quantity: {
              $gte: take,
            },
          },
          {
            $inc: {
              quantity: -take,
            },
          },
          {
            new: true,
          }
        );

      if (!updated) {
        throw new Error(
          "Location stock changed while the transaction was being processed"
        );
      }

      applied.push({
        stockId: stock._id,
        quantity: take,
      });

      remaining -= take;
    }

    if (remaining > 0) {
      throw new Error(
        "Unable to deduct all location stock"
      );
    }

    return applied;
  } catch (error) {
    for (const step of applied) {
      await LocationStock.updateOne(
        {
          _id: step.stockId,
        },
        {
          $inc: {
            quantity: step.quantity,
          },
        }
      );
    }

    throw error;
  }
};


const rollbackDeductions = async (plans) => {
  for (const plan of plans || []) {
    for (const step of plan.applied || []) {
      await LocationStock.updateOne(
        {
          _id: step.stockId,
        },
        {
          $inc: {
            quantity: step.quantity,
          },
        }
      );
    }
  }
};


const addItemsToLocation = async (
  items,
  locationId
) => {
  const applied = [];

  try {
    for (const item of items) {
      await addToLocation(
        item.product,
        locationId,
        item.quantity
      );

      applied.push({
        product: item.product,
        quantity: item.quantity,
      });
    }

    return applied;
  } catch (error) {
    for (const step of applied) {
      await LocationStock.updateOne(
        {
          product: step.product,
          location: locationId,
        },
        {
          $inc: {
            quantity: -step.quantity,
          },
        }
      );
    }

    throw error;
  }
};


const rollbackLocationAdds = async (
  items,
  locationId
) => {
  for (const item of items || []) {
    await LocationStock.updateOne(
      {
        product: item.product,
        location: locationId,
      },
      {
        $inc: {
          quantity: -Number(item.quantity),
        },
      }
    );
  }
};


const ensureProductAllocated = async (
  productOrId
) => {
  const product =
    typeof productOrId === "object" &&
    productOrId?._id
      ? productOrId
      : await Product.findById(productOrId);

  if (!product) {
    throw new Error("Product not found");
  }

  const locations =
    await ensureSystemLocations();

  const allocated =
    await getProductLocationTotal(
      product._id
    );

  const expected =
    Number(product.quantity || 0);

  const difference =
    expected - allocated;

  if (difference > 0) {
    await addToLocation(
      product._id,
      locations.warehouse._id,
      difference
    );
  }

  if (difference < 0) {
    await deductFromLocations(
      product._id,
      Math.abs(difference)
    );
  }

  return product;
};


const reconcileProductLocations = async (
  productId,
  targetQuantity
) => {
  const locations =
    await ensureSystemLocations();

  const allocated =
    await getProductLocationTotal(
      productId
    );

  const target =
    Number(targetQuantity || 0);

  const difference =
    target - allocated;

  if (difference > 0) {
    await addToLocation(
      productId,
      locations.warehouse._id,
      difference
    );
  }

  if (difference < 0) {
    await deductFromLocations(
      productId,
      Math.abs(difference)
    );
  }

  return getProductLocationTotal(
    productId
  );
};


const deductItemsFromLocations = async (
  items
) => {
  const plans = [];

  try {
    for (const item of items) {
      const applied =
        await deductFromLocations(
          item.product,
          item.quantity
        );

      plans.push({
        product: item.product,
        applied,
      });
    }

    return plans;
  } catch (error) {
    await rollbackDeductions(
      plans
    );

    throw error;
  }
};


module.exports = {
  ensureSystemLocations,
  getProductLocationTotal,
  addToLocation,
  decreaseSingleLocation,
  deductFromLocations,
  rollbackDeductions,
  addItemsToLocation,
  rollbackLocationAdds,
  ensureProductAllocated,
  reconcileProductLocations,
  deductItemsFromLocations,
};
