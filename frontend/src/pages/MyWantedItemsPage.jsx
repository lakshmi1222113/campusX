
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../services/api";
import { formatCurrency } from "../utils/formatCurrency";

import "./MyWantedItemsPage.css";

export default function MyWantedItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    maxPrice: "",
  });

  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadMyWantedItems = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest("/wanted-items?mine=true");

      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.message || "Unable to load your wanted items.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyWantedItems();
  }, [loadMyWantedItems]);

  function startEditing(item) {
    setEditingId(item.id);
    setActionError("");

    setForm({
      title: item.title || "",
      description: item.description || "",
      maxPrice:
        item.maxPrice != null ? String(item.maxPrice) : "",
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setActionError("");

    setForm({
      title: "",
      description: "",
      maxPrice: "",
    });
  }

  async function handleSave(event, itemId) {
    event.preventDefault();
    setActionError("");

    if (!form.title.trim()) {
      setActionError("Please enter a title.");
      return;
    }

    if (
      form.maxPrice.trim() !== "" &&
      (!Number.isFinite(Number(form.maxPrice)) ||
        Number(form.maxPrice) < 0)
    ) {
      setActionError(
        "Budget must be a valid non-negative number."
      );
      return;
    }

    try {
      setSaving(true);

      await apiRequest(`/wanted-items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          maxPrice:
            form.maxPrice.trim() === ""
              ? null
              : Number(form.maxPrice),
        }),
      });

      setEditingId(null);
      await loadMyWantedItems();
    } catch (err) {
      setActionError(
        err.message || "Unable to update this request."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Delete your request "${item.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setActionError("");

    try {
      await apiRequest(`/wanted-items/${item.id}`, {
        method: "DELETE",
      });

      if (editingId === item.id) {
        cancelEditing();
      }

      await loadMyWantedItems();
    } catch (err) {
      setActionError(
        err.message || "Unable to delete this request."
      );
    }
  }

  return (
    <main className="my-wanted-page">
      <div className="my-wanted-container">
        <header className="my-wanted-header">
          <div>
            <p className="my-wanted-eyebrow">
              YOUR CAMPUSX ACCOUNT
            </p>

            <h1>My Wanted Items</h1>

            <p className="my-wanted-subtitle">
              View the items you are looking for and manage your
              requests.
            </p>
          </div>

          <Link
            to="/wanted-items/create"
            className="my-wanted-create-button"
          >
            + Post a Request
          </Link>
        </header>

        <div className="my-wanted-toolbar">
          <div>
            <h2>Your requests</h2>

            {!loading && !error && (
              <p>
                {items.length}{" "}
                {items.length === 1 ? "request" : "requests"} posted
              </p>
            )}
          </div>

          <Link
            to="/wanted-items"
            className="my-wanted-public-link"
          >
            Browse all requests →
          </Link>
        </div>

        {actionError && (
          <div className="my-wanted-action-error" role="alert">
            {actionError}
          </div>
        )}

        {loading && (
          <div className="my-wanted-state">
            <div className="my-wanted-spinner" />
            <p>Loading your requests...</p>
          </div>
        )}

        {!loading && error && (
          <div className="my-wanted-items-error">
            <h2>Couldn't load your requests</h2>
            <p>{error}</p>

            <p>Please log in to manage your requests.</p>

            <div className="my-wanted-items-error-actions">
              <Link
                to="/login"
                className="my-wanted-items-login-button"
              >
                Log in
              </Link>

              <button
                type="button"
                onClick={loadMyWantedItems}
                className="my-wanted-items-retry-button"
              >
                Try again
              </button>
            </div>

            <p className="my-wanted-login-note">
              Already logged in? Try again to reload your requests.
            </p>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="my-wanted-empty">
            <div className="my-wanted-empty-icon">⌕</div>

            <h2>You haven't posted any requests yet</h2>

            <p>
              Looking for a textbook, electronics, or another campus
              essential? Create your first request. It will also
              appear on the public Wanted Items page.
            </p>

            <Link
              to="/wanted-items/create"
              className="my-wanted-create-button"
            >
              Create your first request →
            </Link>

            <Link
              to="/wanted-items"
              className="my-wanted-secondary-link"
            >
              Browse other students' requests
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <section className="my-wanted-grid">
            {items.map((item) => (
              <article className="my-wanted-card" key={item.id}>
                <div className="my-wanted-card-top">
                  <span className="my-wanted-tag">
                    MY REQUEST
                  </span>

                  <span className="my-wanted-date">
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

                {editingId === item.id ? (
                  <form
                    className="my-wanted-edit-form"
                    onSubmit={(event) =>
                      handleSave(event, item.id)
                    }
                  >
                    <label>
                      Title
                      <input
                        value={form.title}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            title: event.target.value,
                          })
                        }
                        maxLength={150}
                        required
                      />
                    </label>

                    <label>
                      Description
                      <textarea
                        value={form.description}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            description: event.target.value,
                          })
                        }
                        rows={3}
                      />
                    </label>

                    <label>
                      Maximum budget (₹)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.maxPrice}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            maxPrice: event.target.value,
                          })
                        }
                        placeholder="Leave blank if not applicable"
                      />
                    </label>

                    <div className="my-wanted-actions">
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
                    <h3>{item.title}</h3>

                    <p className="my-wanted-description">
                      {item.description ||
                        "No additional details provided."}
                    </p>

                    {item.maxPrice != null && (
                      <div className="my-wanted-budget">
                        <span>Maximum budget</span>
                        <strong>
                          {formatCurrency(item.maxPrice)}
                        </strong>
                      </div>
                    )}

                    <div className="my-wanted-card-footer">
                      <span>
                        <span className="my-wanted-status-dot" />
                        Visible to campus students
                      </span>

                      <Link
                        to="/wanted-items"
                        className="my-wanted-view-link"
                      >
                        Public page →
                      </Link>
                    </div>

                    <div className="my-wanted-actions">
                      <button
                        type="button"
                        onClick={() => startEditing(item)}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        className="my-wanted-delete-button"
                        onClick={() => handleDelete(item)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
