
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./LoginPage.css";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    college: "",
    department: "",
    year: "1",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phoneNumber: form.phoneNumber.trim(),
        college: form.college.trim(),
        department: form.department.trim(),
        year: Number(form.year),
      });

      navigate("/login", {
        state: {
          message: "Registration successful. Please log in.",
        },
      });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        <Link className="brand auth-brand" to="/">
          <span className="brand-icon">C</span>
          CampusX
        </Link>

        <h1>Join CampusX</h1>
        <p>Create your student marketplace account.</p>

        <form onSubmit={handleSubmit}>
          <div className="register-grid">
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full name"
              autoComplete="name"
              aria-label="Full name"
              required
            />

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="College email"
              autoComplete="email"
              aria-label="College email"
              required
            />

            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              autoComplete="new-password"
              minLength={8}
              aria-label="Password"
              required
            />

            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={form.phoneNumber}
              onChange={handleChange}
              placeholder="Mobile number (10 digits)"
              autoComplete="tel"
              inputMode="numeric"
              pattern="([+]91[ -]?)?[6-9][0-9]{9}"
              title="Enter a valid 10-digit Indian mobile number, optionally with +91"
              aria-label="Mobile number"
              required
            />

            <input
              id="college"
              name="college"
              value={form.college}
              onChange={handleChange}
              placeholder="College name"
              aria-label="College name"
              required
            />

            <input
              id="department"
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="Department (e.g. CSE)"
              aria-label="Department"
              required
            />

            <select
              id="year"
              name="year"
              value={form.year}
              onChange={handleChange}
              aria-label="Study year"
              required
            >
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <p className="phone-privacy-note">
            Your phone number is kept private and is shared with the seller
            only after your order is accepted.
          </p>

          {error && <p className="message error">{error}</p>}

          <button
            className="primary-btn auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Login</Link>
        </p>

        <Link className="auth-home-link" to="/">
          ← Back to marketplace
        </Link>
      </div>
    </div>
  );
}
