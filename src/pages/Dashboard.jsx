import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listExpenses } from "../api/expenses";
import { useAuth } from "../hooks/useAuth";
import { Alert } from "../components/ui";
import { parseApiError } from "../lib/apiError";

const STATUSES = [
  { key: "pending", label: "Pending Expenses" },
  { key: "approved", label: "Approved Expenses" },
  { key: "rejected", label: "Rejected Expenses" },
];

function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      setLoading(true);
      setError("");
      try {
        // One cheap request per status: only the pagination total is needed.
        const results = await Promise.all(
          STATUSES.map(({ key }) => listExpenses({ status: key, limit: 1 }))
        );
        if (cancelled) return;
        setCounts(
          Object.fromEntries(
            STATUSES.map(({ key }, index) => [key, results[index].pagination.total])
          )
        );
      } catch (err) {
        if (!cancelled) setError(parseApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCounts();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1>Expense Approval System</h1>

      <h2>Dashboard{user ? ` — ${user.name} (${user.role})` : ""}</h2>

      <Alert kind="error">{error}</Alert>

      <div className="stats">
        {STATUSES.map(({ key, label }) => (
          <div className="stat-card" key={key}>
            <h3>{label}</h3>
            <p>{loading ? "…" : counts[key]}</p>
          </div>
        ))}
      </div>

      <div className="row-actions">
        <Link className="button-link primary" to="/expenses">
          View all expenses
        </Link>
        <Link className="button-link" to="/expenses?status=pending">
          {user?.role === "manager" ? "Review pending expenses" : "My pending expenses"}
        </Link>
        {user?.role === "employee" && (
          <Link className="button-link" to="/create-expense">
            Submit an expense
          </Link>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
