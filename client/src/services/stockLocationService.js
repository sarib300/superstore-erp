import api from "./api";


export const getStockLocations =
  async () => {
    const response =
      await api.get(
        "/stock-locations"
      );

    return response.data;
  };


export const createStockLocation =
  async (data) => {
    const response =
      await api.post(
        "/stock-locations",
        data
      );

    return response.data;
  };


export const updateStockLocation =
  async (id, data) => {
    const response =
      await api.put(
        `/stock-locations/${id}`,
        data
      );

    return response.data;
  };


export const getLocationStock =
  async (id) => {
    const response =
      await api.get(
        `/stock-locations/${id}/stock`
      );

    return response.data;
  };


export const getStockTransfers =
  async () => {
    const response =
      await api.get(
        "/stock-locations/transfers"
      );

    return response.data;
  };


export const createStockTransfer =
  async (data) => {
    const response =
      await api.post(
        "/stock-locations/transfers",
        data
      );

    return response.data;
  };


export const syncExistingStock =
  async () => {
    const response =
      await api.post(
        "/stock-locations/sync-existing"
      );

    return response.data;
  };
