
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Profile state
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const currentUser = profile || user;

  const [form, setForm] = useState({
    name: "",
    department: "",
    year: "",
    college: "",
    phoneNumber: "",
  });

  // Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  function startEditing() {
    setForm({
      name: currentUser?.name || "",
      department: currentUser?.department || "",
      year:
        currentUser?.year != null
          ? String(currentUser.year)
          : "",
      college: currentUser?.college || "",
      phoneNumber: currentUser?.phoneNumber || "",
    });

    setEditing(true);
    setMessage("");
    setError("");
  }

  function cancelEditing() {
    setEditing(false);
    setError("");
    setMessage("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await apiRequest("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name.trim(),
          department: form.department.trim(),
          year: form.year === "" ? null : Number(form.year),
          college: form.college.trim(),
          phoneNumber: form.phoneNumber.trim(),
        }),
      });

      setProfile(result.data);
      setEditing(false);
      setMessage(result.message || "Profile updated successfully!");
    } catch (err) {
      setError(err.message || "Unable to update your profile.");
    } finally {
      setSaving(false);
    }
  }

  function handlePasswordInput(event) {
    const { name, value } = event.target;

    setPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function cancelPasswordChange() {
    setShowPasswordForm(false);
    setPasswordError("");
    setPasswordMessage("");

    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  }

  async function handleChangePassword(event) {
    event.preventDefault();

    setPasswordError("");
    setPasswordMessage("");

    if (
      passwordForm.newPassword !== passwordForm.confirmPassword
    ) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (
      passwordForm.currentPassword === passwordForm.newPassword
    ) {
      setPasswordError(
        "New password must differ from your current password."
      );
      return;
    }

    setPasswordSaving(true);

    try {
      const result = await apiRequest("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      setPasswordMessage(
        result.message || "Password changed successfully!"
      );

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setShowPasswordForm(false);
    } catch (err) {
      setPasswordError(
        err.message || "Unable to change your password."
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="profile-page">
          <div className="profile-loading">
            Loading your profile...
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const name = currentUser.name || "CampusX Student";
  const initial = name.charAt(0).toUpperCase();

  const accountLinks = [
    { to: "/profile", icon: "◉", label: "My Profile" },
    { to: "/cart", icon: "🛒", label: "My Cart" },
    { to: "/my-orders", icon: "📦", label: "My Orders" },
    { to: "/wishlist", icon: "♡", label: "My Wishlist" },
    { to: "/seller-orders", icon: "▣", label: "Seller Orders" },
    { to: "/my-listings", icon: "▤", label: "My Listings" },
    
    { to: "/wanted-items", icon: "⌕", label: "Wanted Items" },
    {
      to: "/my-wanted-items",
      icon: "▧",
      label: "My Wanted Items",
    },
  ];

  const studyYear =
    currentUser.year != null
      ? `${currentUser.year}${
          currentUser.year === 1
            ? "st"
            : currentUser.year === 2
              ? "nd"
              : currentUser.year === 3
                ? "rd"
                : "th"
        } Year`
      : "Not provided";

  return (
    <>
      <Navbar />

      <main className="profile-page">
        <div className="profile-container">
          <nav
            className="profile-breadcrumb"
            aria-label="Breadcrumb"
          >
            <Link to="/">Home</Link>
            <span>/</span>
            <span>My Account</span>
            <span>/</span>
            <strong>Profile</strong>
          </nav>

          <header className="profile-heading">
            <h1>My Account</h1>
            <p>
              Welcome back, {name}! Manage your CampusX account.
            </p>
          </header>

          <div className="profile-layout">
            {/* Sidebar */}
            <aside className="profile-sidebar">
              <div className="profile-user-summary">
                <div className="profile-avatar">{initial}</div>
                <h2>{name}</h2>
                <p>{currentUser.email}</p>

                <span className="profile-status">
                  <span className="status-dot" />
                  Student Account
                </span>
              </div>

              <nav
                className="profile-menu"
                aria-label="Account menu"
              >
                <div className="profile-menu-heading">
                  MY ACCOUNT
                </div>

                {accountLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`profile-menu-item ${
                      item.to === "/profile" ? "active" : ""
                    }`}
                    aria-current={
                      item.to === "/profile" ? "page" : undefined
                    }
                  >
                    <span
                      className="menu-icon"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>

                    <span className="menu-label">
                      {item.label}
                    </span>

                    <span
                      className="menu-arrow"
                      aria-hidden="true"
                    >
                      ›
                    </span>
                  </Link>
                ))}

                <button
                  type="button"
                  className="profile-menu-item profile-logout-link"
                  onClick={handleLogout}
                >
                  <span className="menu-icon" aria-hidden="true">
                    ↪
                  </span>
                  <span className="menu-label">Logout</span>
                </button>
              </nav>
            </aside>

            {/* Main content */}
            <section className="profile-main">
              <div className="profile-card">
                {/* Personal information heading */}
                <div className="profile-card-heading">
                  <div>
                    <h2>Personal Information</h2>
                    <p>
                      View and manage your registered student
                      details.
                    </p>
                  </div>

                  {!editing && (
                    <button
                      type="button"
                      className="profile-edit-button"
                      onClick={startEditing}
                    >
                      <span aria-hidden="true">✎</span>
                      Edit Profile
                    </button>
                  )}
                </div>

                {message && (
                  <div
                    className="profile-alert profile-alert-success"
                    role="status"
                  >
                    {message}
                  </div>
                )}

                {error && !editing && (
                  <div
                    className="profile-alert profile-alert-error"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                {/* Edit profile form */}
                {editing ? (
                  <form onSubmit={handleSave}>
                    <div className="profile-edit-grid">
                      <div className="profile-form-field">
                        <label htmlFor="profile-name">
                          Full Name
                        </label>
                        <input
                          id="profile-name"
                          name="name"
                          type="text"
                          value={form.name}
                          onChange={handleChange}
                          maxLength={100}
                          required
                        />
                      </div>

                      <div className="profile-form-field">
                        <label htmlFor="profile-email">
                          Email Address
                        </label>
                        <input
                          id="profile-email"
                          type="email"
                          value={currentUser.email || ""}
                          disabled
                        />
                        <small>
                          Email address cannot be changed here.
                        </small>
                      </div>

                      <div className="profile-form-field">
                        <label htmlFor="profile-department">
                          Department
                        </label>
                        <input
                          id="profile-department"
                          name="department"
                          type="text"
                          placeholder="e.g. CSE"
                          value={form.department}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="profile-form-field">
                        <label htmlFor="profile-phoneNumber">
                          Mobile Number
                        </label>
                        <input
                          id="profile-phoneNumber"
                          name="phoneNumber"
                          type="tel"
                          value={form.phoneNumber}
                          onChange={handleChange}
                          placeholder="10-digit mobile number"
                          autoComplete="tel"
                          inputMode="numeric"
                          pattern="([+]91[ -]?)?[6-9][0-9]{9}"
                          title="Enter a valid 10-digit Indian mobile number, optionally with +91"
                        />
                        <small>
                          Your number is shared with the seller only after your order is accepted.
                        </small>
                      </div>

                      <div className="profile-form-field">
                        <label htmlFor="profile-year">
                          Study Year
                        </label>
                        <select
                          id="profile-year"
                          name="year"
                          value={form.year}
                          onChange={handleChange}
                        >
                          <option value="">
                            Select study year
                          </option>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </select>
                      </div>

                      <div className="profile-form-field profile-form-full">
                        <label htmlFor="profile-college">
                          College
                        </label>
                        <input
                          id="profile-college"
                          name="college"
                          type="text"
                          placeholder="Enter your college name"
                          value={form.college}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    {error && (
                      <div
                        className="profile-alert profile-alert-error"
                        role="alert"
                      >
                        {error}
                      </div>
                    )}

                    <div className="profile-form-actions">
                      <button
                        type="button"
                        className="profile-cancel-button"
                        onClick={cancelEditing}
                        disabled={saving}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="profile-save-button"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="profile-info-grid">
                      <div className="profile-info-item">
                        <span>Full Name</span>
                        <strong>{name}</strong>
                      </div>

                      <div className="profile-info-item">
                        <span>Email Address</span>
                        <strong>
                          {currentUser.email || "Not provided"}
                        </strong>
                      </div>

                      <div className="profile-info-item">
                        <span>Mobile Number</span>
                        <strong>
                          {currentUser.phoneNumber || "Not provided"}
                        </strong>
                      </div>

                      <div className="profile-info-item">
                        <span>Department</span>
                        <strong>
                          {currentUser.department || "Not provided"}
                        </strong>
                      </div>

                      <div className="profile-info-item">
                        <span>Study Year</span>
                        <strong>{studyYear}</strong>
                      </div>

                      <div className="profile-info-item">
                        <span>Account Role</span>
                        <strong>
                          {currentUser.role || "STUDENT"}
                        </strong>
                      </div>

                      <div className="profile-info-item">
                        <span>College</span>
                        <strong>
                          {currentUser.college || "Not provided"}
                        </strong>
                      </div>
                    </div>

                    <div className="profile-note">
                      <span
                        className="profile-note-icon"
                        aria-hidden="true"
                      >
                        i
                      </span>
                      <p>
                        Your account details are displayed here.
                        Select Edit Profile to update your
                        information.
                      </p>
                    </div>
                  </>
                )}

                {/* Security and password section */}
                <div className="profile-password-section">
                  <div className="profile-password-heading">
                    <div>
                      <h3>Security &amp; Password</h3>
                      <p>
                        Keep your CampusX account secure.
                      </p>
                    </div>

                    {!showPasswordForm && (
                      <button
                        type="button"
                        className="profile-edit-button"
                        onClick={() => {
                          setShowPasswordForm(true);
                          setPasswordError("");
                          setPasswordMessage("");
                        }}
                      >
                        Change Password
                      </button>
                    )}
                  </div>

                  {passwordMessage && (
                    <div
                      className="profile-alert profile-alert-success"
                      role="status"
                    >
                      {passwordMessage}
                    </div>
                  )}

                  {passwordError && (
                    <div
                      className="profile-alert profile-alert-error"
                      role="alert"
                    >
                      {passwordError}
                    </div>
                  )}

                  {showPasswordForm && (
                    <form onSubmit={handleChangePassword}>
                      <div className="profile-password-fields">
                        <div className="profile-form-field">
                          <label htmlFor="currentPassword">
                            Current Password
                          </label>
                          <input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={passwordForm.currentPassword}
                            onChange={handlePasswordInput}
                          />
                        </div>

                        <div className="profile-form-field">
                          <label htmlFor="newPassword">
                            New Password
                          </label>
                          <input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            autoComplete="new-password"
                            minLength={8}
                            required
                            value={passwordForm.newPassword}
                            onChange={handlePasswordInput}
                          />
                        </div>

                        <div className="profile-form-field">
                          <label htmlFor="confirmPassword">
                            Confirm New Password
                          </label>
                          <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            minLength={8}
                            required
                            value={passwordForm.confirmPassword}
                            onChange={handlePasswordInput}
                          />
                        </div>
                      </div>

                      <div className="profile-form-actions">
                        <button
                          type="button"
                          className="profile-cancel-button"
                          onClick={cancelPasswordChange}
                          disabled={passwordSaving}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="profile-save-button"
                          disabled={passwordSaving}
                        >
                          {passwordSaving
                            ? "Updating..."
                            : "Update Password"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
