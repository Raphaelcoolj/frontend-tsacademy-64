// Turns an axios error into a shape the UI can render directly:
//   { status, message, fields }  — fields is the backend's { field: message }
//   object on 400, otherwise null.
export function parseApiError(error) {
  const status = error.response?.status;
  const body = error.response?.data;

  if (status && body?.data?.errors) {
    return { status, message: body.message || "Validation failed", fields: body.data.errors };
  }

  if (error.request && !error.response) {
    return { status: null, message: "Unable to connect to the server. Please try again.", fields: null };
  }

  return {
    status: status ?? null,
    message: body?.message || "Something went wrong. Please try again.",
    fields: null,
  };
}
