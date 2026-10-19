
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import { formatCurrency } from "../utils/formatCurrency";
import "./WantedItemsPage.css";

export default function WantedItemsPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  const isLoggedIn = Boolean(localStorage.getItem("campusx_token"));
  const createRequestPath = isLoggedIn
    ? "/wanted-items/create"
    : "/login";

  const loadWantedItems = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Public requests should be accessible without logging in.
      const response = await apiRequest("/wanted-items");

      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.message || "Unable to load wanted items.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const response = await apiRequest("/wanted-items");

        if (!cancelled) {
          setItems(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load wanted items.");
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [retry]);

  const filteredItems = items.filter((item) => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) return true;

    return (
      item.title?.toLowerCase().includes(searchText) ||
      item.description?.toLowerCase().includes(searchText) ||
      item.user?.name?.toLowerCase().includes(searchText)
    );
  });

  return (
    <main className="wanted-page">
      <div className="wanted-container">
        <header className="wanted-header">
          <div>
            <p className="wanted-eyebrow">CAMPUSX COMMUNITY</p>
            <h1>Wanted Items</h1>
            <p className="wanted-subtitle">
              Looking for something? Find requests from students on your campus.
            </p>
          </div>

          <Link to={createRequestPath} className="wanted-create-button">
            + Post a Request
          </Link>
        </header>

        <section className="wanted-search">
          <label htmlFor="wanted-search-input">Search requests</label>
          <input
            id="wanted-search-input"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search books, electronics, lab equipment..."
          />
        </section>

        {!loading && !error && (
          <div className="wanted-results-heading">
            <h2>Student requests</h2>
            <span>
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "request" : "requests"}
            </span>
          </div>
        )}

        {loading && (
          <div className="wanted-message">Loading requests...</div>
        )}

        {!loading && error && (
          <div className="wanted-message wanted-error" role="alert">
            <h2>Could not load requests</h2>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setRetry((value) => value + 1)}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredItems.length === 0 && (
          <div className="wanted-message">
            <div className="wanted-empty-icon">⌕</div>
            <h2>No requests found</h2>
            <p>
              {search.trim()
                ? "Try a different search term."
                : "No one has posted a request yet. Be the first!"}
            </p>
            <Link to={createRequestPath} className="wanted-create-button">
              Post a Request
            </Link>
          </div>
        )}

        {!loading && !error && filteredItems.length > 0 && (
          <section className="wanted-grid">
            {filteredItems.map((item) => (
              <article className="wanted-card" key={item.id}>
                <div className="wanted-card-top">
                  <span className="wanted-tag">WANTED</span>
                </div>

                <h3>{item.title}</h3>
                <p className="wanted-description">
                  {item.description || "No additional details provided."}
                </p>

                {item.maxPrice != null && (
                  <p className="wanted-budget">
                    Maximum budget:{" "}
                    <strong>{formatCurrency(item.maxPrice)}</strong>
                  </p>
                )}

                <div className="wanted-card-footer">
                  <div>
                    <span className="wanted-posted-label">Posted by</span>
                    <strong>{item.user?.name || "Campus student"}</strong>
                  </div>

                  <span className="wanted-date">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("en-IN")
                      : ""}
                  </span>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
