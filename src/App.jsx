import { useEffect, useState } from "react";
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";

import { AuthProvider } from "./AuthContext";
import { useAuth } from "./hooks/useAuth";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateExpense from "./pages/CreateExpense";
import Expenses from "./pages/Expenses";

// Blocks a screen until the session is known, and keeps users on the screens
// their role allows (the API enforces this too; this is UX only).
function RequireAuth({ children, roles }) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <main className="page">
        <div className="loading-row">
          <span className="spinner" aria-hidden="true" />
          Restoring your session…
        </div>
      </main>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function Nav() {
  const { user, initializing, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="app-header">
      <nav className="app-nav">
        <Link className="brand" to={user ? "/dashboard" : "/"}>
          {/* <span className="brand-mark" aria-hidden="true" /> */}
          Expense Approval
        </Link>

        <button
          className="menu-btn"
          type="button"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={menuOpen ? "links open" : "links"}>
          {user && (
            <NavLink to="/" end>
              Home
            </NavLink>
          )}
          {user && <NavLink to="/dashboard">Dashboard</NavLink>}
          {user?.role === "employee" && (
            <NavLink to="/create-expense">New expense</NavLink>
          )}
          {user && <NavLink to="/expenses">Expenses</NavLink>}

          {!user && !initializing && <NavLink to="/login">Login</NavLink>}
          {!user && !initializing && <NavLink to="/register">Register</NavLink>}

          {user && (
            <>
              <span className="whoami">
                {user.name}
                <span className="role-tag">{user.role}</span>
              </span>
              <button className="btn small" type="button" onClick={logout}>
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />

        <Routes>
          <Route path="/" element={<Landing />} />
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

        <footer className="app-footer">
          <a href="https://github.com/tsacademy-group-64" target="_blank" rel="noreferrer">
            GitHub · tsacademy-group-64
          </a>
        </footer>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
