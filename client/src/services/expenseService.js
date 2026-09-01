import api from "./api";


export const getExpenses = async () => {
  const response = await api.get(
    "/expenses"
  );

  return response.data;
};


export const getExpenseById = async (id) => {
  const response = await api.get(
    `/expenses/${id}`
  );

  return response.data;
};


export const createExpense = async (data) => {
  const response = await api.post(
    "/expenses",
    data
  );

  return response.data;
};


export const updateExpense = async (
  id,
  data
) => {
  const response = await api.put(
    `/expenses/${id}`,
    data
  );

  return response.data;
};


export const cancelExpense = async (id) => {
  const response = await api.patch(
    `/expenses/${id}/cancel`
  );

  return response.data;
};