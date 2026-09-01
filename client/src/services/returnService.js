import api from "./api";


export const getReturns = async () => {
  const response = await api.get(
    "/returns"
  );

  return response.data;
};


export const getReturnById = async (id) => {
  const response = await api.get(
    `/returns/${id}`
  );

  return response.data;
};


export const getReturnableSale = async (
  saleId
) => {
  const response = await api.get(
    `/returns/sale/${saleId}`
  );

  return response.data;
};


export const createReturn = async (data) => {
  const response = await api.post(
    "/returns",
    data
  );

  return response.data;
};