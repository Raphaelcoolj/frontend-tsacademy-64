import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authService from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import { Alert, FieldError } from "../components/ui";
import { parseApiError } from "../lib/apiError";

const EMPTY = { name: "", email: "", password: "", role: "employee" };

function Register() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFields({});

    setLoading(true);
    try {
      const session = await authService.register(form);
      login(session); // register returns { user, token } just like login
      navigate("/dashboard");
    } catch (err) {
      const parsed = parseApiError(err);
      setFields(parsed.fields ?? {});
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth">
      <section className="auth-brand">
        <h1>Start tracking expenses</h1>
        <p>
          One account is enough: employees file their costs, managers clear the
          queue, everyone sees the same status and the reason behind it.
        </p>
        <ul>
          <li>Employees submit and track their own reports</li>
          <li>Managers approve or reject with a documented reason</li>
          <li>Nothing is final until a manager decides</li>
        </ul>
      </section>

      <section className="auth-card">
        <h2>Create your account</h2>
        <p className="muted">It takes less than a minute.</p>

        <form className="form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={form.name}
              onChange={update("name")}
            />
            <FieldError fields={fields} name="name" />
          </div>

          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update("email")}
            />
            <FieldError fields={fields} name="email" />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={update("password")}
            />
            <FieldError fields={fields} name="password" />
          </div>

          <div>
            <label htmlFor="role">I am a</label>
            <select id="role" value={form.role} onChange={update("role")}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </select>
            <FieldError fields={fields} name="role" />
          </div>

          <Alert kind="error">{error}</Alert>

          <div className="form-actions">
            <button className="btn primary" type="submit" disabled={loading}>
              {loading && <span className="spinner" aria-hidden="true" />}
              {loading ? "Creating account..." : "Register"}
            </button>
          </div>
        </form>

        <p className="auth-links">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </section>
    </div>
  );
}

export default Register;
