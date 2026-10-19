
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import "./CreateWantedItemPage.css";

const initialForm = {
  title: "",
  description: "",
  maxPrice: "",
};

export default function CreateWantedItemPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function goToWantedItems() {
    navigate("/wanted-items", { replace: true });
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.title.trim() || !form.description.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (
      form.maxPrice.trim() &&
      (!Number.isFinite(Number(form.maxPrice)) ||
        Number(form.maxPrice) < 0)
    ) {
      setError("Maximum budget must be zero or greater.");
      return;
    }

    try {
      setSubmitting(true);

      await apiRequest("/wanted-items", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          maxPrice: form.maxPrice.trim()
            ? Number(form.maxPrice)
            : null,
        }),
      });

      navigate("/wanted-items", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to create your request.");
    } finally {
      setSubmitting(false);
    }
  }

  const isLoginError =
    /log in|login|unauthorized|401/i.test(error);

  return (
    <main className="create-wanted-page">
      <header className="create-wanted-header">
        <Link to="/marketplace" className="create-wanted-brand">
          <span className="create-wanted-brand-mark">C</span>
          <span>CampusX</span>
        </Link>

        <button
          type="button"
          className="create-wanted-back"
          onClick={goToWantedItems}
        >
          <span aria-hidden="true">←</span>
          Back to Wanted Items
        </button>
      </header>

      <div className="create-wanted-layout">
        <aside className="create-wanted-intro">
          <span className="create-wanted-badge">
            <span className="create-wanted-badge-dot" />
            CAMPUS COMMUNITY
          </span>

          <h1>
            Looking for
            <br />
            something <span>special?</span>
          </h1>

          <p className="create-wanted-intro-text">
            Let your campus community help you find it.
            Post what you need, set your budget, and connect
            with students who have just the right item.
          </p>

          <div className="create-wanted-benefits">
            <div className="create-wanted-benefit">
              <span className="create-wanted-benefit-icon">01</span>
              <div>
                <h3>Describe what you need</h3>
                <p>Include the name and important details.</p>
              </div>
            </div>

            <div className="create-wanted-benefit">
              <span className="create-wanted-benefit-icon">02</span>
              <div>
                <h3>Set your own budget</h3>
                <p>Choose a maximum price that works for you.</p>
              </div>
            </div>

            <div className="create-wanted-benefit">
              <span className="create-wanted-benefit-icon">03</span>
              <div>
                <h3>Connect with students</h3>
                <p>Give others a chance to help you find it.</p>
              </div>
            </div>
          </div>

          <div className="create-wanted-note">
            <span className="create-wanted-note-icon">✦</span>
            <p>
              Better requests get better responses. Add enough
              detail to help other students understand what you need.
            </p>
          </div>
        </aside>

        <section className="create-wanted-card">
          <div className="create-wanted-card-heading">
            <span className="create-wanted-step">YOUR REQUEST</span>
            <h2>Post a wanted request</h2>
            <p>Tell us what you're looking for.</p>
          </div>

          {error && (
            <div className="create-wanted-error" role="alert">
              <span aria-hidden="true">!</span>
              <span>{error}</span>
            </div>
          )}

          {isLoginError && (
            <div className="create-wanted-login-prompt">
              <p>Please log in to continue.</p>
              <Link
                to="/login"
                className="create-wanted-login-button"
              >
                Log in to CampusX →
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="create-wanted-field">
              <label htmlFor="wanted-title">
                Product name <span>*</span>
              </label>

              <input
                id="wanted-title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Engineering mathematics textbook"
                maxLength={120}
                required
              />
              <small>What item do you need?</small>
            </div>

            <div className="create-wanted-field">
              <label htmlFor="wanted-description">
                Description <span>*</span>
              </label>

              <textarea
                id="wanted-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Mention the edition, model, condition or other details..."
                rows={5}
                maxLength={1000}
                required
              />

              <small>
                Add details that could help someone identify the item.
              </small>
            </div>

            <div className="create-wanted-field">
              <label htmlFor="wanted-budget">
                Maximum budget{" "}
                <span className="wanted-optional">Optional</span>
              </label>

              <div className="create-wanted-price-input">
                <span>₹</span>
                <input
                  id="wanted-budget"
                  name="maxPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maxPrice}
                  onChange={handleChange}
                  placeholder="Enter your budget"
                />
              </div>

              <small>Leave empty if you haven't decided yet.</small>
            </div>

            <div className="create-wanted-actions">
              <button
                type="submit"
                className="create-wanted-submit"
                disabled={submitting}
              >
                {submitting ? "Posting request..." : "Post my request"}
                {!submitting && <span aria-hidden="true">→</span>}
              </button>

              <button
                type="button"
                className="create-wanted-cancel"
                onClick={goToWantedItems}
              >
                Cancel
              </button>
            </div>

            <p className="create-wanted-form-footer">
              <span aria-hidden="true">🔒</span>
              Your request will be shared with the campus community.
            </p>
          </form>
        </section>
      </div>

      <footer className="create-wanted-footer">
        CampusX <span>·</span> Made for campus communities
      </footer>
    </main>
  );
}
