
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getListings } from "../services/listingService";
import { getCategories } from "../services/categoryService";
import { apiRequest } from "../services/api";
import { formatCurrency } from "../utils/formatCurrency";
import "./MarketplacePage.css";

function getCategoryPlaceholder(categoryName = "") {
  const category = categoryName.toLowerCase();

  if (category.includes("book")) {
    return { icon: "📚", label: "Books & Study Materials" };
  }

  if (category.includes("cycle") || category.includes("bicycle")) {
    return { icon: "🚲", label: "Cycles" };
  }

  if (
    category.includes("electronic") ||
    category.includes("laptop") ||
    category.includes("computer") ||
    category.includes("mobile") ||
    category.includes("phone") ||
    category.includes("gadget")
  ) {
    return { icon: "💻", label: "Electronics" };
  }

  if (
    category.includes("cloth") ||
    category.includes("fashion") ||
    category.includes("wear")
  ) {
    return { icon: "👕", label: "Clothing & Fashion" };
  }

  if (
    category.includes("accessor") ||
    category.includes("stationery")
  ) {
    return { icon: "🎒", label: "Accessories" };
  }

  if (
    category.includes("furniture") ||
    category.includes("home")
  ) {
    return { icon: "🪑", label: "Home & Furniture" };
  }

  if (
    category.includes("sport") ||
    category.includes("fitness")
  ) {
    return { icon: "⚽", label: "Sports & Fitness" };
  }

  return { icon: "📦", label: "Campus product" };
}

export default function MarketplacePage() {
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [failedImages, setFailedImages] = useState([]);

  const [wishlistIds, setWishlistIds] = useState([]);
  const [wishlistLoadingId, setWishlistLoadingId] = useState("");
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [wishlistError, setWishlistError] = useState(false);

  // Load categories
  useEffect(() => {
    let cancelled = false;

    getCategories()
      .then((response) => {
        if (!cancelled) {
          setCategories(
            Array.isArray(response.data) ? response.data : []
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Load marketplace listings
  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getListings({
          search,
          categoryId,
        });

        if (!cancelled) {
          setListings(
            Array.isArray(response.data) ? response.data : []
          );
          setFailedImages([]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load products.");
          setListings([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, categoryId, retry]);

  // Load wishlist for logged-in users
  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("campusx_token");

    if (!token) {
      setWishlistIds([]);
      return undefined;
    }

    apiRequest("/wishlist")
      .then((response) => {
        if (!cancelled) {
          const items = Array.isArray(response.data)
            ? response.data
            : [];

          setWishlistIds(
            items
              .map((item) => item.listingId || item.listing?.id)
              .filter(Boolean)
          );
        }
      })
      .catch(() => {
        // Marketplace remains usable if wishlist loading fails.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Sort products
  
  // Sort products while preserving backend college priority.
  const sortedListings = useMemo(() => {
    const result = [...listings];

    // Backend already returns same-college products first,
    // followed by other-college products, newest first.
    if (sortBy === "newest") {
      return result;
    }

    // Guests can sort all products normally.
    const token = localStorage.getItem("campusx_token");

    if (!token) {
      return result.sort((a, b) =>
        sortBy === "price-low"
          ? Number(a.price) - Number(b.price)
          : Number(b.price) - Number(a.price)
      );
    }

    // Keep the backend's college-group order.
    const groups = [];
    const collegeGroups = new Map();

    result.forEach((listing) => {
      const college = (
        listing.seller?.college || ""
      ).trim().toLowerCase();

      if (!collegeGroups.has(college)) {
        const group = {
          college,
          listings: [],
        };

        collegeGroups.set(college, group);
        groups.push(group);
      }

      collegeGroups.get(college).listings.push(listing);
    });

    // Sort products only within each college group.
    return groups.flatMap((group) =>
      [...group.listings].sort((a, b) => {
        if (sortBy === "price-low") {
          return Number(a.price) - Number(b.price);
        }

        return Number(b.price) - Number(a.price);
      })
    );
  }, [listings, sortBy]);


  function handleImageError(listingId) {
    setFailedImages((current) =>
      current.includes(listingId)
        ? current
        : [...current, listingId]
    );
  }

  function clearFilters() {
    setSearch("");
    setCategoryId("");
    setSortBy("newest");
  }

  const hasActiveFilters = Boolean(search.trim() || categoryId);

  // Require login before using wishlist
  async function handleAddToWishlist(listingId) {
    const token = localStorage.getItem("campusx_token");

    if (!token) {
      window.alert("Please log in to add products to your wishlist.");
      navigate("/login");
      return;
    }

    if (wishlistIds.includes(listingId)) {
      setWishlistMessage("This product is already in your wishlist.");
      setWishlistError(false);
      return;
    }

    setWishlistLoadingId(listingId);
    setWishlistMessage("");
    setWishlistError(false);

    try {
      await apiRequest("/wishlist", {
        method: "POST",
        body: JSON.stringify({ listingId }),
      });

      setWishlistIds((current) =>
        current.includes(listingId)
          ? current
          : [...current, listingId]
      );

      setWishlistMessage("Product added to wishlist successfully!");
    } catch (err) {
      setWishlistError(true);
      setWishlistMessage(
        err.message || "Unable to add product to wishlist."
      );
    } finally {
      setWishlistLoadingId("");
    }
  }

  return (
    <main className="marketplace-page">
      <div className="marketplace-container">
        {/* Wishlist feedback */}
        {wishlistMessage && (
          <p
            className={
              wishlistError
                ? "marketplace-wishlist-message marketplace-wishlist-error"
                : "marketplace-wishlist-message"
            }
            role="status"
          >
            {wishlistMessage}

            <button
              type="button"
              className="marketplace-message-close"
              onClick={() => setWishlistMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </p>
        )}

        {/* Page heading */}
        <header className="marketplace-header">
          <div className="marketplace-intro">
            <p className="marketplace-eyebrow">
              CAMPUSX MARKETPLACE
            </p>

            <h1 className="marketplace-heading">
              Find what you need.
            </h1>

            <p className="marketplace-subtitle">
              Discover books, electronics and essentials
              from students on your campus.
            </p>
          </div>

          <div className="marketplace-header-actions">
            <Link
              to="/listings/create"
              className="marketplace-create-button"
            >
              <span aria-hidden="true">＋</span>
              Create Listing
            </Link>
          </div>
        </header>

        {/* Search and category filters */}
        <section
          className="marketplace-search-section"
          aria-label="Search and filter products"
        >
          <div className="marketplace-filter-field marketplace-search-field">
            <label
              htmlFor="listing-search"
              className="marketplace-search-label"
            >
              Search products
            </label>

            <input
              id="listing-search"
              className="marketplace-search-input"
              type="search"
              placeholder="Search books, electronics, accessories..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="marketplace-filter-field">
            <label
              htmlFor="listing-category"
              className="marketplace-search-label"
            >
              Category
            </label>

            <select
              id="listing-category"
              className="marketplace-category-select"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">All categories</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Results heading and sorting */}
        {!loading && !error && (
          <div className="marketplace-results-toolbar">
            <div className="marketplace-results-heading">
              <div>
                <h2>
                  {hasActiveFilters
                    ? "Search results"
                    : "Explore products"}
                </h2>

                <p className="marketplace-results-count">
                  {sortedListings.length}{" "}
                  {sortedListings.length === 1
                    ? "product"
                    : "products"}{" "}
                  found
                </p>
              </div>
            </div>

            <div className="marketplace-toolbar-actions">
              <label
                htmlFor="listing-sort"
                className="marketplace-sort-label"
              >
                Sort by
              </label>

              <select
                id="listing-sort"
                className="marketplace-sort-select"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="marketplace-clear-button"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div
            className="marketplace-message"
            role="status"
            aria-live="polite"
          >
            Loading products...
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <section
            className="marketplace-message marketplace-error"
            role="alert"
          >
            <h2>Unable to load products</h2>
            <p>{error}</p>

            <button
              type="button"
              className="marketplace-create-button"
              onClick={() => setRetry((value) => value + 1)}
            >
              Try again
            </button>
          </section>
        )}

        {/* Empty state */}
        {!loading && !error && sortedListings.length === 0 && (
          <section className="marketplace-message">
            <h2>No products found</h2>

            <p>
              Try another search term or choose a different category.
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                className="marketplace-clear-button"
                onClick={clearFilters}
              >
                Clear search and filters
              </button>
            )}
          </section>
        )}

        {/* Product grid */}
        {!loading && !error && sortedListings.length > 0 && (
          <section
            className="marketplace-product-grid"
            aria-label="Marketplace products"
          >
            {sortedListings.map((listing) => {
              const imageFailed = failedImages.includes(listing.id);
              const detailsUrl = `/listings/${listing.id}`;

              const condition = (
                listing.condition || "Not specified"
              )
                .replaceAll("_", " ")
                .toLowerCase();

              const isWishlisted = wishlistIds.includes(listing.id);

              const placeholder = getCategoryPlaceholder(
                listing.category?.name || ""
              );

              return (
                <article
                  className="marketplace-product-card"
                  key={listing.id}
                >
                  {/* Product image and wishlist button */}
                  <div className="marketplace-product-media">
                    <Link
                      to={detailsUrl}
                      className="marketplace-product-image-link"
                      aria-label={`View ${listing.title}`}
                    >
                      <div className="marketplace-product-image">
                        {listing.imageUrl && !imageFailed ? (
                          <img
                            src={listing.imageUrl}
                            alt={listing.title}
                            loading="lazy"
                            onError={() => handleImageError(listing.id)}
                          />
                        ) : (
                          <div className="marketplace-image-placeholder">
                            <span
                              className="marketplace-placeholder-icon"
                              aria-hidden="true"
                            >
                              {placeholder.icon}
                            </span>

                            <span>{placeholder.label}</span>

                            <small>Image not provided</small>
                          </div>
                        )}
                      </div>
                    </Link>

                    <button
                      type="button"
                      className={`marketplace-heart-button ${
                        isWishlisted ? "is-wishlisted" : ""
                      }`}
                      onClick={() => handleAddToWishlist(listing.id)}
                      disabled={wishlistLoadingId === listing.id}
                      aria-label={
                        isWishlisted
                          ? "Already in wishlist"
                          : "Add to wishlist"
                      }
                      aria-pressed={isWishlisted}
                      title={
                        isWishlisted
                          ? "Already in wishlist"
                          : "Add to wishlist"
                      }
                    >
                      {wishlistLoadingId === listing.id
                        ? "…"
                        : isWishlisted
                          ? "♥"
                          : "♡"}
                    </button>
                  </div>

                  {/* Product information */}
                  <div className="marketplace-product-content">
                    <p className="marketplace-product-category">
                      {listing.category?.name || "Campus product"}
                    </p>

                    <h3 className="marketplace-product-title">
                      <Link to={detailsUrl}>{listing.title}</Link>
                    </h3>

                    <p className="marketplace-product-price">
                      {formatCurrency(listing.price)}
                    </p>

                    <p className="marketplace-product-meta">
                      <strong>Condition:</strong>{" "}
                      <span>{condition}</span>
                    </p>

                    <p className="marketplace-product-meta marketplace-product-seller">
                      <strong>Seller:</strong>{" "}
                      <span>
                        {listing.seller?.name || "Campus student"}
                      </span>
                    </p>
                     <p className="listing-college">
  <span>College:</span>{" "}
  {listing.seller?.college || "College not provided"}
</p>
                    <Link
                      to={detailsUrl}
                      className="marketplace-details-button"
                    >
                      View Details
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
