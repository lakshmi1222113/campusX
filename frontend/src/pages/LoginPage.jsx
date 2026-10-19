
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./LoginPage.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link className="brand auth-brand" to="/">
          <span className="brand-icon">C</span>
          CampusX
        </Link>

        <h1>Welcome back!</h1>
        <p>Login to your campus marketplace account.</p>   
<form onSubmit={handleSubmit}>
  <input
    id="email"
    type="email"
    placeholder="College email"
    value={email}
    onChange={(event) => setEmail(event.target.value)}
    autoComplete="email"
    aria-label="College email"
    required
  />

  <input
    id="password"
    type="password"
    placeholder="Enter your password"
    value={password}
    onChange={(event) => setPassword(event.target.value)}
    autoComplete="current-password"
    aria-label="Password"
    required
  />

  {error && <p className="message error">{error}</p>}

  <button
    className="primary-btn auth-submit"
    type="submit"
    disabled={loading}
  >
    {loading ? "Logging in..." : "Login"}
  </button>
</form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

        <Link className="auth-home-link" to="/">
          ← Back to marketplace
        </Link>
      </div>
    </div>
  );
}
