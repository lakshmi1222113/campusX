
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getCategories } from "../services/categoryService";
import { getListings } from "../services/listingService";

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const result = await getCategories();

        if (!cancelled) {
          setCategories(result.data || []);
        }
      } catch {
        if (!cancelled) {
          setError("Categories load avvaledu. Backend check cheyyi.");
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadListings() {
      setLoading(true);
      setError("");

      try {
        const result = await getListings({ search, categoryId });

        if (!cancelled) {
          setListings(result.data || []);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Listings load avvaledu. Backend running lo undho check cheyyi."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadListings();

    return () => {
      cancelled = true;
    };
  }, [search, categoryId]);

  return (
    <div className="campusx">
      <Navbar />

      <main>
        {/* Hero section */}
        <section className="hero-section">
          <div className="hero-content">
            <span className="eyebrow">
              YOUR CAMPUS. YOUR COMMUNITY.
            </span>

            <h1>
              Buy, sell & exchange
              <br />
              <span>with your campus.</span>
            </h1>

            <p>
              Find affordable books, electronics, notes and everyday
              essentials from students in your college.
            </p>

            <a className="primary-btn" href="#marketplace">
              Explore Marketplace ↗
            </a>
          </div>

          <div
            className="hero-art"
            aria-label="Campus marketplace illustration"
          >
            <div className="art-circle"></div>

            <div className="art-card art-book">
              <span>📚</span>
              <strong>Books & Notes</strong>
              <small>Learn more, spend less</small>
            </div>

            <div className="art-card art-phone">
              <span>🎧</span>
              <strong>Student essentials</strong>
              <small>Find your next favourite</small>
            </div>

            <div className="art-tag">Made for students ✦</div>
          </div>
        </section>

        {/* Marketplace section */}
        <section className="market-section" id="marketplace">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE CAMPUS MARKET</span>
              <h2>Find what you need.</h2>
              <p>Good finds. Student-friendly prices.</p>
            </div>

            <span className="item-count">
              {listings.length}{" "}
              {listings.length === 1 ? "item" : "items"} shown
            </span>
          </div>

          {/* Search and category filter */}
          <div className="filters">
            <input
              type="search"
              placeholder="Search books, electronics, notes..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search marketplace listings"
            />

            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Loading state */}
          {loading && (
            <p className="message" role="status">
              Loading marketplace...
            </p>
          )}

          {/* Error state */}
          {!loading && error && (
            <p className="message error" role="alert">
              {error}
            </p>
          )}

          {/* Empty state */}
          {!loading && !error && listings.length === 0 && (
            <div className="empty-state">
              <span>🛍️</span>
              <h3>No available items yet</h3>
              <p>
                New listings will appear here. Try another search or
                category.
              </p>
            </div>
          )}

          {/* Clickable product cards */}
          {!loading && !error && listings.length > 0 && (
            <div className="listing-grid">
              {listings.map((item) => (
                <Link
                  to={`/listings/${item.id}`}
                  className="listing-card-link"
                  key={item.id}
                  aria-label={`View details for ${item.title}`}
                >
                  <article className="listing-card">
                    <div className="listing-image">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          loading="lazy"
                        />
                      ) : (
                        <span aria-hidden="true">📦</span>
                      )}

                      {item.condition && (
                        <span className="condition">
                          {item.condition.replaceAll("_", " ")}
                        </span>
                      )}
                    </div>

                    <div className="listing-info">
                      <span className="category-label">
                        {item.category?.name || "Campus item"}
                      </span>

                      <h3>{item.title}</h3>

                      <p className="description">
                        {item.description}
                      </p>

                      <div className="listing-footer">
                        <strong>
                          ₹
                          {Number(item.price).toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}
                        </strong>

                        <span>
                          👤 {item.seller?.name || "Student"}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Wanted items section */}
        <section className="wanted-section" id="wanted">
          <div>
            <span className="eyebrow">CAN'T FIND IT?</span>
            <h2>Tell your campus what you need.</h2>
            <p>
              Wanted Items feature helps students find things they're
              looking for.
            </p>

            <Link
              to="/wanted-items"
              className="primary-btn wanted-browse-btn"
            >
              Explore wanted items →
            </Link>
          </div>

          <span className="wanted-icon" aria-hidden="true">
            🔎
          </span>
        </section>
      </main>

      <Footer />
    </div>
  );
}
