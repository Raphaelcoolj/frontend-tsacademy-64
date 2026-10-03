// Small presentational helpers shared by the pages.

export function FieldError({ fields, name }) {
  if (!fields?.[name]) return null;
  return <p className="field-error">{fields[name]}</p>;
}

export function Alert({ kind = "error", children }) {
  if (!children) return null;
  return <div className={`alert ${kind}`}>{children}</div>;
}

const STATUS_LABELS = {
  pending: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
};

export function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{STATUS_LABELS[status] ?? status}</span>;
}
