import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createExpense } from "../api/expenses";
import { Alert, FieldError } from "../components/ui";
import { parseApiError } from "../lib/apiError";

const EMPTY = {
  title: "",
  amount: "",
  category: "",
  expenseDate: "",
  description: "",
  receiptDetails: "",
};

function CreateExpense() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState({});

  const navigate = useNavigate();

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFields({});

    setLoading(true);
    try {
      await createExpense({
        title: form.title.trim(),
        amount: Number(form.amount), // the API expects a number, not a string
        category: form.category.trim(),
        date: form.expenseDate, // YYYY-MM-DD, `date` is the documented alias
        description: form.description.trim(),
        receiptDetails: form.receiptDetails.trim(),
      });
      navigate("/expenses");
    } catch (err) {
      const parsed = parseApiError(err);
      setFields(parsed.fields ?? {});
      setError(parsed.message);
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Create Expense</h1>
      <p className="page-sub">
        Describe the cost and attach the receipt details. It goes to a manager for review.
      </p>

      <div className="card" style={{ maxWidth: 640 }}>
        <form className="form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="title">Expense Title</label>
            <input
              id="title"
              type="text"
              placeholder="Enter expense title"
              value={form.title}
              onChange={update("title")}
            />
            <FieldError fields={fields} name="title" />
          </div>

          <div className="form-row">
            <div>
              <label htmlFor="amount">Amount</label>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter amount"
                value={form.amount}
                onChange={update("amount")}
              />
              <FieldError fields={fields} name="amount" />
            </div>

            <div>
              <label htmlFor="category">Category</label>
              <input
                id="category"
                type="text"
                placeholder="e.g. Transport, Food, Supplies"
                value={form.category}
                onChange={update("category")}
              />
              <FieldError fields={fields} name="category" />
            </div>
          </div>

          <div>
            <label htmlFor="expenseDate">Expense Date</label>
            <input
              id="expenseDate"
              type="date"
              value={form.expenseDate}
              onChange={update("expenseDate")}
            />
            <FieldError fields={fields} name="expenseDate" />
          </div>

          <div>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              placeholder="Enter expense description"
              value={form.description}
              onChange={update("description")}
            />
            <FieldError fields={fields} name="description" />
          </div>

          <div>
            <label htmlFor="receiptDetails">Receipt Details</label>
            <textarea
              id="receiptDetails"
              placeholder="Plain-text receipt info (there are no file uploads)"
              value={form.receiptDetails}
              onChange={update("receiptDetails")}
            />
            <FieldError fields={fields} name="receiptDetails" />
          </div>

          <Alert kind="error">{error}</Alert>

          <div className="form-actions">
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Expense"}
            </button>
            <span className="muted">A new expense is always sent for review (pending).</span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateExpense;
