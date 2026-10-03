import api from "./client";

// params: status, category, fromDate, toDate, sortBy, sortOrder, page, limit
export async function listExpenses(params = {}) {
  const { data } = await api.get("/expenses", { params: cleanParams(params) });
  return data.data; // { expenses, pagination }
}

export async function getExpense(id) {
  const { data } = await api.get(`/expenses/${id}`);
  return data.data.expense;
}

export async function createExpense(payload) {
  const { data } = await api.post("/expenses", payload);
  return data.data.expense; // status is always "pending"
}

export async function updateExpense(id, payload) {
  const { data } = await api.patch(`/expenses/${id}`, payload);
  return data.data.expense;
}

export async function deleteExpense(id) {
  const { data } = await api.delete(`/expenses/${id}`);
  return data.message;
}

export async function approveExpense(id) {
  const { data } = await api.patch(`/expenses/${id}/approve`);
  return data.data.expense;
}

export async function rejectExpense(id, rejectionReason) {
  const { data } = await api.patch(`/expenses/${id}/reject`, { rejectionReason });
  return data.data.expense;
}

// Drop empty values so the backend applies its own defaults instead of
// rejecting "" as an invalid status/date.
function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );
}
