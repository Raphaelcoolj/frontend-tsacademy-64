import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  approveExpense,
  deleteExpense,
  listExpenses,
  rejectExpense,
  updateExpense,
} from "../api/expenses";
import { useAuth } from "../hooks/useAuth";
import { Alert, FieldError, StatusBadge } from "../components/ui";
import { parseApiError } from "../lib/apiError";

const STATUS_OPTIONS = ["", "pending", "approved", "rejected"];
const LIMIT = 10;

const EMPTY_EDIT = {
  title: "",
  amount: "",
  category: "",
  expenseDate: "",
  description: "",
  receiptDetails: "",
};

function toFormValues(expense) {
  return {
    title: expense.title ?? "",
    amount: expense.amount ?? "",
    category: expense.category ?? "",
    expenseDate: (expense.expenseDate ?? "").slice(0, 10),
    description: expense.description ?? "",
    receiptDetails: expense.receiptDetails ?? "",
  };
}

function Expenses() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") ?? "";
  const category = searchParams.get("category") ?? "";
  const page = Number(searchParams.get("page")) || 1;

  const [categoryInput, setCategoryInput] = useState(category);
  // Keep the filter input in sync when the URL category changes
  // (e.g. clearing filters) — adjusted during render, not in an effect.
  const [syncedCategory, setSyncedCategory] = useState(category);
  if (category !== syncedCategory) {
    setSyncedCategory(category);
    setCategoryInput(category);
  }
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: LIMIT, total: 0, totalPages: 1 });
  const [error, setError] = useState("");

  // "Loading" is derived from the query key: a query that has not been
  // answered yet is loading, so no state has to be flipped inside the effect.
  const queryKey = `${status}|${category}|${page}`;
  const [loadedKey, setLoadedKey] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const loading = loadedKey !== queryKey || refreshing;
  const requestId = useRef(0);
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectFields, setRejectFields] = useState({});

  const [editing, setEditing] = useState(null); // expense being edited
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editFields, setEditFields] = useState({});
  const [editError, setEditError] = useState("");

  const load = useCallback(async () => {
    const id = ++requestId.current; // ignore responses a newer request superseded
    try {
      const data = await listExpenses({
        status,
        category,
        page,
        limit: LIMIT,
        sortBy: "date",
        sortOrder: "desc",
      });
      if (id !== requestId.current) return;
      setExpenses(data.expenses);
      setPagination(data.pagination);
      setError("");
      setLoadedKey(queryKey);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(parseApiError(err).message);
      setLoadedKey(queryKey);
    } finally {
      if (id === requestId.current) setRefreshing(false);
    }
  }, [status, category, page, queryKey]);

  // Data fetching on query change: every setState in load() happens after the
  // `await`, never synchronously during the render/effect pass.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    load();
  }, [load]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page"); // filters reset paging
    setSearchParams(next);
  };

  const runAction = async (id, onSuccess, failureFallback) => {
    setBusyId(id);
    setNotice("");
    setError("");
    try {
      await onSuccess();
    } catch (err) {
      const parsed = parseApiError(err);
      // 409 = someone else finalized it first → refresh the list (README §14.11).
      const stale = parsed.status === 409 || parsed.status === 404;
      if (stale) setError(`${parsed.message} — the list has been refreshed.`);
      else if (!parsed.fields) setError(parsed.message);
      failureFallback?.(parsed);
      if (stale) await load();
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = (expense) =>
    runAction(expense._id, async () => {
      await approveExpense(expense._id);
      setNotice(`"${expense.title}" approved.`);
      await load();
    });

  const startReject = (expense) => {
    setRejectingId(expense._id);
    setRejectReason("");
    setRejectFields({});
  };

  const handleReject = async (expense) => {
    setRejectFields({});
    await runAction(
      expense._id,
      async () => {
        await rejectExpense(expense._id, rejectReason.trim());
        setNotice(`"${expense.title}" rejected.`);
        setRejectingId(null);
        setRejectReason("");
        await load();
      },
      (parsed) => setRejectFields(parsed.fields ?? {})
    );
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete "${expense.title}"? This cannot be undone.`)) return;
    await runAction(expense._id, async () => {
      await deleteExpense(expense._id);
      setNotice(`"${expense.title}" deleted.`);
      await load();
    });
  };

  const startEdit = (expense) => {
    setEditing(expense);
    setEditForm(toFormValues(expense));
    setEditFields({});
    setEditError("");
  };

  const updateEdit = (key) => (e) => setEditForm({ ...editForm, [key]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setEditFields({});
    setEditError("");

    await runAction(
      editing._id,
      async () => {
        await updateExpense(editing._id, {
          title: editForm.title.trim(),
          amount: Number(editForm.amount),
          category: editForm.category.trim(),
          date: editForm.expenseDate,
          description: editForm.description.trim(),
          receiptDetails: editForm.receiptDetails.trim(),
        });
        setNotice(`"${editForm.title}" updated.`);
        setEditing(null);
        await load();
      },
      (parsed) => {
        setEditFields(parsed.fields ?? {});
        setEditError(parsed.fields ? "" : parsed.message);
      }
    );
  };

  const isBusy = (expense) => busyId === expense._id;

  return (
    <div>
      <h1>My Expenses</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        {isManager
          ? "All expenses — you can approve or reject pending ones."
          : "Your submitted expenses and their review status."}
      </p>

      <Alert kind="error">{error}</Alert>
      <Alert kind="success">{notice}</Alert>

      <div className="toolbar">
        <label className="field">
          Status
          <select value={status} onChange={(e) => setParam("status", e.target.value)}>
            {STATUS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value === "" ? "All" : value}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Category
          <input
            type="text"
            placeholder="e.g. Transport"
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setParam("category", categoryInput.trim());
            }}
          />
        </label>

        <button
          className="btn"
          type="button"
          onClick={() => setParam("category", categoryInput.trim())}
        >
          Apply filter
        </button>

        {(status || category) && (
          <button
            className="btn"
            type="button"
            onClick={() => {
              setCategoryInput("");
              setSearchParams({});
            }}
          >
            Clear
          </button>
        )}

        <button
          className="btn"
          type="button"
          disabled={loading}
          onClick={() => {
            setRefreshing(true);
            load();
          }}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>

        {!isManager && (
          <Link className="button-link primary" to="/create-expense">
            New expense
          </Link>
        )}
      </div>

      {editing && (
        <form className="edit-panel" onSubmit={handleSave}>
          <h3>
            Edit: {editing.title}{" "}
            <button
              className="btn small"
              type="button"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          </h3>

          <div className="form">
            <div>
              <label htmlFor="edit-title">Title</label>
              <input id="edit-title" value={editForm.title} onChange={updateEdit("title")} />
              <FieldError fields={editFields} name="title" />
            </div>

            <div className="form-row">
              <div>
                <label htmlFor="edit-amount">Amount</label>
                <input
                  id="edit-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editForm.amount}
                  onChange={updateEdit("amount")}
                />
                <FieldError fields={editFields} name="amount" />
              </div>
              <div>
                <label htmlFor="edit-category">Category</label>
                <input
                  id="edit-category"
                  value={editForm.category}
                  onChange={updateEdit("category")}
                />
                <FieldError fields={editFields} name="category" />
              </div>
            </div>

            <div>
              <label htmlFor="edit-date">Expense date</label>
              <input
                id="edit-date"
                type="date"
                value={editForm.expenseDate}
                onChange={updateEdit("expenseDate")}
              />
              <FieldError fields={editFields} name="expenseDate" />
            </div>

            <div>
              <label htmlFor="edit-description">Description</label>
              <textarea
                id="edit-description"
                value={editForm.description}
                onChange={updateEdit("description")}
              />
              <FieldError fields={editFields} name="description" />
            </div>

            <div>
              <label htmlFor="edit-receipt">Receipt details</label>
              <textarea
                id="edit-receipt"
                value={editForm.receiptDetails}
                onChange={updateEdit("receiptDetails")}
              />
              <FieldError fields={editFields} name="receiptDetails" />
            </div>

            <Alert kind="error">{editError}</Alert>

            <div className="form-actions">
              <button className="btn primary" type="submit" disabled={isBusy(editing)}>
                {isBusy(editing) ? "Saving..." : "Save changes"}
              </button>
              <span className="muted">Only pending expenses can be edited.</span>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <p className="muted">Loading expenses…</p>
      ) : expenses.length === 0 ? (
        <p className="muted">No expenses found.</p>
      ) : (
        <table className="expenses">
          <thead>
            <tr>
              <th>Title</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Date</th>
              <th>Status</th>
              {isManager && <th>Submitted by</th>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => {
              const pending = expense.status === "pending";
              const mine = expense.submittedBy?._id ?? expense.submittedBy;
              const canEdit = !isManager && pending && mine === user?.id;

              return (
                <tr key={expense._id}>
                  <td>
                    <strong>{expense.title}</strong>
                    {expense.description && (
                      <div className="muted">{expense.description}</div>
                    )}
                    {expense.receiptDetails && (
                      <div className="muted">Receipt: {expense.receiptDetails}</div>
                    )}
                  </td>
                  <td className="amount">{expense.amount}</td>
                  <td>{expense.category}</td>
                  <td>{(expense.expenseDate ?? "").slice(0, 10)}</td>
                  <td>
                    <StatusBadge status={expense.status} />
                    {expense.status === "rejected" && expense.rejectionReason && (
                      <div className="rejection">Reason: {expense.rejectionReason}</div>
                    )}
                    {expense.reviewedAt && (
                      <div className="muted">
                        Reviewed {expense.reviewedAt.slice(0, 10)}
                        {expense.reviewedBy?.name ? ` by ${expense.reviewedBy.name}` : ""}
                      </div>
                    )}
                  </td>
                  {isManager && (
                    <td>
                      {expense.submittedBy?.name ?? "—"}
                      {expense.submittedBy?.email && (
                        <div className="muted">{expense.submittedBy.email}</div>
                      )}
                    </td>
                  )}
                  <td>
                    <div className="row-actions">
                      {isManager && pending && (
                        <>
                          <button
                            className="btn small primary"
                            type="button"
                            disabled={isBusy(expense)}
                            onClick={() => handleApprove(expense)}
                          >
                            {isBusy(expense) ? "Working..." : "Approve"}
                          </button>
                          <button
                            className="btn small danger"
                            type="button"
                            disabled={isBusy(expense)}
                            onClick={() => startReject(expense)}
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {canEdit && (
                        <>
                          <button
                            className="btn small"
                            type="button"
                            onClick={() => startEdit(expense)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn small danger"
                            type="button"
                            disabled={isBusy(expense)}
                            onClick={() => handleDelete(expense)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>

                    {rejectingId === expense._id && (
                      <div className="reject-box">
                        <input
                          type="text"
                          placeholder="Reason (3–500 characters)"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <button
                          className="btn small danger"
                          type="button"
                          disabled={isBusy(expense)}
                          onClick={() => handleReject(expense)}
                        >
                          Confirm reject
                        </button>
                        <button
                          className="btn small"
                          type="button"
                          onClick={() => setRejectingId(null)}
                        >
                          Cancel
                        </button>
                        <FieldError fields={rejectFields} name="rejectionReason" />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div className="pagination">
        <button
          className="btn small"
          type="button"
          disabled={loading || page <= 1}
          onClick={() => setParam("page", String(page - 1))}
        >
          ← Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
        </span>
        <button
          className="btn small"
          type="button"
          disabled={loading || page >= pagination.totalPages}
          onClick={() => setParam("page", String(page + 1))}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default Expenses;
