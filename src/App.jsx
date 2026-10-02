import { BrowserRouter, Navigate, NavLink, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./AuthContext";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateExpense from "./pages/CreateExpense";
import Expenses from "./pages/Expenses";

// Blocks a screen until the session is known, and keeps users on the screens
// their role allows (the API enforces this too — this is UX only).
function RequireAuth({ children, roles }) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <main className="page">
        <p className="muted">Restoring session…</p>
      </main>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function Nav() {
  const { user, initializing, logout } = useAuth();

  return (
    <nav className="app-nav">
      <h2>Expense Approval System</h2>

      <div className="links">
        {user && <NavLink to="/dashboard">Dashboard</NavLink>}
        {user?.role === "employee" && <NavLink to="/create-expense">Create Expense</NavLink>}
        {user && <NavLink to="/expenses">Expenses</NavLink>}

        {!user && !initializing && <NavLink to="/login">Login</NavLink>}
        {!user && !initializing && <NavLink to="/register">Register</NavLink>}

        {user && (
          <>
            <span className="whoami">
              {user.name} · {user.role}
            </span>
            <button className="btn small" type="button" onClick={logout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <hr />

        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />

          <Route
            path="/create-expense"
            element={
              <RequireAuth roles={["employee"]}>
                <CreateExpense />
              </RequireAuth>
            }
          />

          <Route
            path="/expenses"
            element={
              <RequireAuth>
                <Expenses />
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
