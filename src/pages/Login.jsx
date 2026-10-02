import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authService from "../api/auth";
import { useAuth } from "../hooks/useAuth";
import { Alert, FieldError } from "../components/ui";
import { parseApiError } from "../lib/apiError";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setFields({});

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const session = await authService.login(email, password);
      login(session); // stores { user, token }
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
    <div>
      <h1>Expense Approval System</h1>

      <h2>Login</h2>

      <form className="form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FieldError fields={fields} name="email" />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FieldError fields={fields} name="password" />
        </div>

        <Alert kind="error">{error}</Alert>

        <div className="form-actions">
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </div>
      </form>

      <p className="auth-links">
        No account yet? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export default Login;
