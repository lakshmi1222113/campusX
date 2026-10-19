
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import { formatCurrency } from "../utils/formatCurrency";
import "./MyListingsPage.css";

const emptyForm = {
  title: "",
  description: "",
  price: "",
  condition: "GOOD",
  imageUrl: "",
  categoryId: "",
};

export default function MyListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  const loadMyListings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest("/listings/mine");
      setListings(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.message || "Unable to load your listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyListings();
  }, [loadMyListings]);

  const counts = useMemo(() => {
    return listings.reduce(
      (result, item) => {
        const status = (item.status || "AVAILABLE").toUpperCase();
        result.total += 1;

        if (status === "AVAILABLE") result.available += 1;
        if (status === "RESERVED") result.reserved += 1;
        if (status === "EXCHANGED") result.exchanged += 1;

        return result;
      },
      { total: 0, available: 0, reserved: 0, exchanged: 0 }
    );
  }, [listings]);

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = listings.filter((item) => {
      const matchesSearch = [
        item.title,
        item.description,
        item.category?.name,
        item.condition,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

      const status = (item.status || "AVAILABLE").toUpperCase();
      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return result.sort((a, b) => {
      if (sortBy === "price-low") {
        return Number(a.price) - Number(b.price);
      }
      if (sortBy === "price-high") {
        return Number(b.price) - Number(a.price);
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [listings, search, statusFilter, sortBy]);

  function startEditing(item) {
    setEditingId(item.id);
    setActionError("");
    setActionMessage("");

    setForm({
      title: item.title || "",
      description: item.description || "",
      price: item.price != null ? String(item.price) : "",
      condition: item.condition || "GOOD",
      imageUrl: item.imageUrl || "",
      categoryId: item.categoryId || item.category?.id || "",
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm);
    setActionError("");
  }

  async function handleSave(event, item) {
    event.preventDefault();
    setActionError("");
    setActionMessage("");

    if (!form.title.trim() || !form.description.trim()) {
      setActionError("Title and description are required.");
      return;
    }

    if (
      form.price.trim() === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      setActionError("Enter a valid non-negative price.");
      return;
    }

    if (!form.categoryId) {
      setActionError("Category is required. Please keep the existing category.");
      return;
    }

    try {
      setSaving(true);

      await apiRequest(`/listings/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          condition: form.condition,
          imageUrl: form.imageUrl.trim() || null,
          categoryId: form.categoryId,
        }),
      });

      setEditingId(null);
      setForm(emptyForm);
      setActionMessage("Listing updated successfully.");
      await loadMyListings();
    } catch (err) {
      setActionError(err.message || "Unable to update this listing.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Delete "${item.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionError("");
    setActionMessage("");

    try {
      setDeletingId(item.id);

      await apiRequest(`/listings/${item.id}`, {
        method: "DELETE",
      });

      if (editingId === item.id) {
        setEditingId(null);
        setForm(emptyForm);
      }

      setActionMessage("Listing deleted successfully.");
      await loadMyListings();
    } catch (err) {
      setActionError(err.message || "Unable to delete this listing.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="my-listings-page">
      <div className="my-listings-container">
        <div className="my-listings-topline">
          <span className="my-listings-brand-mark">C</span>
          <span className="my-listings-brand-name">CampusX</span>
          <span className="my-listings-topline-divider">/</span>
          <span className="my-listings-topline-label">Seller dashboard</span>
        </div>

        <header className="my-listings-header">
          <div className="my-listings-header-copy">
            <span className="my-listings-eyebrow">
              YOUR CAMPUS MARKETPLACE
            </span>
            <h1>My listings<span>.</span></h1>
            <p className="my-listings-subtitle">
              Everything you’re selling, all in one place. Manage your
              products and keep track of their availability.
            </p>

            <div className="my-listings-header-actions">
              <Link
                to="/listings/create"
                className="my-listings-primary-button"
              >
                <span aria-hidden="true">＋</span> Sell an item
              </Link>
              <Link
                to="/marketplace"
                className="my-listings-secondary-button"
              >
                Browse marketplace <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>

          <div className="my-listings-header-art" aria-hidden="true">
            <div className="my-listings-art-circle my-listings-art-circle-one" />
            <div className="my-listings-art-circle my-listings-art-circle-two" />
            <div className="my-listings-art-card">
              <span className="my-listings-art-icon">↗</span>
              <span className="my-listings-art-caption">YOUR CAMPUS STORE</span>
              <strong>List it.<br />Sell it.</strong>
              <span className="my-listings-art-line" />
              <span className="my-listings-art-line short" />
            </div>
            <span className="my-listings-art-spark">✳</span>
          </div>
        </header>

        <section className="my-listings-stats" aria-label="Listing summary">
          <article className="my-listings-stat">
            <span className="my-listings-stat-icon stat-icon-total">▦</span>
            <div>
              <p>Total listings</p>
              <strong>{counts.total}</strong>
            </div>
            <span className="my-listings-stat-note">Your products</span>
          </article>

          <article className="my-listings-stat">
            <span className="my-listings-stat-icon stat-icon-available">✓</span>
            <div>
              <p>Available</p>
              <strong>{counts.available}</strong>
            </div>
            <span className="my-listings-stat-note">Open for buyers</span>
          </article>

          <article className="my-listings-stat">
            <span className="my-listings-stat-icon stat-icon-reserved">◷</span>
            <div>
              <p>Reserved</p>
              <strong>{counts.reserved}</strong>
            </div>
            <span className="my-listings-stat-note">Order in progress</span>
          </article>

          <article className="my-listings-stat">
            <span className="my-listings-stat-icon stat-icon-exchanged">↗</span>
            <div>
              <p>Exchanged</p>
              <strong>{counts.exchanged}</strong>
            </div>
            <span className="my-listings-stat-note">Completed items</span>
          </article>
        </section>

        <section className="my-listings-products-section">
          <div className="my-listings-toolbar">
            <div>
              <span className="my-listings-section-label">INVENTORY</span>
              <h2>Your products</h2>
              {!loading && !error && (
                <p>
                  Showing {filteredListings.length} of {listings.length}{" "}
                  {listings.length === 1 ? "product" : "products"}
                </p>
              )}
            </div>
          </div>

          <div className="my-listings-controls">
            <label className="my-listings-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Search your products..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search your listings"
              />
              {search && (
                <button
                  type="button"
                  className="my-listings-clear-search"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </label>

            <label className="my-listings-filter">
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by listing status"
              >
                <option value="ALL">All statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="RESERVED">Reserved</option>
                <option value="EXCHANGED">Exchanged</option>
                <option value="REMOVED">Removed</option>
              </select>
            </label>

            <label className="my-listings-filter">
              <span>Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort listings"
              >
                <option value="newest">Newest first</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </label>
          </div>

          {actionMessage && (
            <p className="my-listings-success" role="status">
              <span>✓</span> {actionMessage}
            </p>
          )}

          {actionError && (
            <p className="my-listings-action-error" role="alert">
              {actionError}
            </p>
          )}

          {loading && (
            <div className="my-listings-state">
              <div className="my-listings-spinner" />
              <h2>Loading your products</h2>
              <p>Getting your listings ready...</p>
            </div>
          )}

          {!loading && error && (
            <div className="my-listings-state my-listings-error">
              <div className="my-listings-empty-icon">!</div>
              <h2>Couldn't load your listings</h2>
              <p>{error}</p>

              {!localStorage.getItem("campusx_token") && (
                <Link to="/login" className="my-listings-primary-button">
                  Log in <span aria-hidden="true">→</span>
                </Link>
              )}

              <button type="button" onClick={loadMyListings}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && listings.length === 0 && (
            <div className="my-listings-state my-listings-empty">
              <div className="my-listings-empty-icon">▦</div>
              <h2>Your store starts here</h2>
              <p>
                Have a textbook, gadget or other campus item to sell?
                Create your first listing and make it available to students.
              </p>
              <Link to="/listings/create" className="my-listings-primary-button">
                ＋ Create your first listing
              </Link>
            </div>
          )}

          {!loading && !error && listings.length > 0 &&
            filteredListings.length === 0 && (
              <div className="my-listings-state my-listings-empty">
                <div className="my-listings-empty-icon">⌕</div>
                <h2>No matching products</h2>
                <p>Try another search or change the status filter.</p>
                <button
                  type="button"
                  className="my-listings-reset-button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}

          {!loading && !error && filteredListings.length > 0 && (
            <section className="my-listings-grid">
              {filteredListings.map((item) => (
                <article className="my-listing-card" key={item.id}>
                  <div className="my-listing-image">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="my-listing-image-fallback">◇</span>
                    )}

                    <span
                      className={`my-listing-status status-${(
                        item.status || "available"
                      ).toLowerCase()}`}
                    >
                      <span className="my-listing-status-dot" />
                      {(item.status || "AVAILABLE").replaceAll("_", " ")}
                    </span>

                    <span className="my-listing-image-category">
                      {item.category?.name || "Campus item"}
                    </span>
                  </div>

                  <div className="my-listing-content">
                    {editingId === item.id ? (
                      <form
                        className="my-listing-edit-form"
                        onSubmit={(event) => handleSave(event, item)}
                      >
                        <h3>Edit listing</h3>

                        <label>
                          Title
                          <input
                            required
                            maxLength={150}
                            value={form.title}
                            onChange={(event) =>
                              setForm({ ...form, title: event.target.value })
                            }
                          />
                        </label>

                        <label>
                          Description
                          <textarea
                            required
                            rows={3}
                            value={form.description}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                description: event.target.value,
                              })
                            }
                          />
                        </label>

                        <label>
                          Price (₹)
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={form.price}
                            onChange={(event) =>
                              setForm({ ...form, price: event.target.value })
                            }
                          />
                        </label>

                        <label>
                          Condition
                          <select
                            value={form.condition}
                            onChange={(event) =>
                              setForm({ ...form, condition: event.target.value })
                            }
                          >
                            <option value="NEW">New</option>
                            <option value="LIKE_NEW">Like New</option>
                            <option value="GOOD">Good</option>
                            <option value="FAIR">Fair</option>
                          </select>
                        </label>

                        <label>
                          Image URL
                          <input
                            type="url"
                            value={form.imageUrl}
                            onChange={(event) =>
                              setForm({ ...form, imageUrl: event.target.value })
                            }
                            placeholder="https://..."
                          />
                        </label>

                        <label>
                          Category ID
                          <input
                            required
                            value={form.categoryId}
                            onChange={(event) =>
                              setForm({ ...form, categoryId: event.target.value })
                            }
                          />
                        </label>

                        <div className="my-listing-actions my-listing-edit-actions">
                          <button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save changes"}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            disabled={saving}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <p className="my-listing-category">
                          {item.category?.name || "Campus item"}
                        </p>

                        <h3 title={item.title}>{item.title}</h3>

                        <p className="my-listing-description">
                          {item.description || "No description provided."}
                        </p>

                        <div className="my-listing-price">
                          {formatCurrency(item.price)}
                        </div>

                        <div className="my-listing-meta">
                          <span className="my-listing-condition">
                            {item.condition
                              ? item.condition.replaceAll("_", " ")
                              : "Condition not specified"}
                          </span>
                          <span>
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : ""}
                          </span>
                        </div>

                        <div className="my-listing-actions">
                          <Link
                            to={`/listings/${item.id}`}
                            className="my-listing-view-button"
                          >
                            View details <span aria-hidden="true">↗</span>
                          </Link>
                          <button
                            type="button"
                            className="my-listing-edit-button"
                            onClick={() => startEditing(item)}
                            disabled={deletingId === item.id}
                            aria-label={`Edit ${item.title}`}
                            title="Edit listing"
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="my-listing-delete-button"
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item.id}
                            aria-label={`Delete ${item.title}`}
                            title="Delete listing"
                          >
                            {deletingId === item.id ? "…" : "×"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}
        </section>

        <footer className="my-listings-footer">
          <span>CampusX</span>
          <span>Made for your campus community.</span>
        </footer>
      </div>
    </main>
  );
}
