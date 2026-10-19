
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getListingById } from "../services/listingService";
import { apiRequest } from "../services/api";
import { formatCurrency } from "../utils/formatCurrency";
import "./ListingDetailsPage.css";

export default function ListingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadListing() {
      try {
        setLoading(true);
        setError("");

        const response = await getListingById(id);

        if (!cancelled) {
          setListing(response.data);
          setImageError(false);
          setActionMessage("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load product details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadListing();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        if (!localStorage.getItem("campusx_token")) {
          if (!cancelled) {
            setCurrentUser(null);
          }
          return;
        }

        const response = await apiRequest("/auth/me");

        if (!cancelled) {
          setCurrentUser(response.data || null);
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setUserLoading(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  // Check whether this product is already in the wishlist.
  useEffect(() => {
    let cancelled = false;

    async function loadWishlistStatus() {
      if (!currentUser || !listing?.id) {
        setIsWishlisted(false);
        return;
      }

      try {
        const response = await apiRequest("/wishlist");
        const items = Array.isArray(response.data)
          ? response.data
          : [];

        const exists = items.some(
          (item) =>
            String(item.listingId || item.listing?.id) ===
            String(listing.id)
        );

        if (!cancelled) {
          setIsWishlisted(exists);
        }
      } catch {
        // Keep the product page usable if wishlist status fails.
      }
    }

    loadWishlistStatus();

    return () => {
      cancelled = true;
    };
  }, [currentUser, listing?.id]);

  function requireLogin() {
    if (userLoading) {
      setActionError(true);
      setActionMessage("Please wait while we check your login.");
      return false;
    }

    if (!currentUser) {
      navigate("/login");
      return false;
    }

    return true;
  }

  async function handleAddToWishlist() {
    setActionMessage("");
    setActionError(false);

    if (!requireLogin()) return;
    if (!listing || isOwnListing) return;

    if (isWishlisted) {
      setActionMessage("This product is already in your wishlist.");
      return;
    }

    try {
      setWishlistLoading(true);

      await apiRequest("/wishlist", {
        method: "POST",
        body: JSON.stringify({ listingId: listing.id }),
      });

      setIsWishlisted(true);
      setActionMessage("Added to your wishlist!");
    } catch (err) {
      setActionError(true);
      setActionMessage(
        err.message || "Could not add to wishlist."
      );
    } finally {
      setWishlistLoading(false);
    }
  }

  async function handleAddToCart() {
    setActionMessage("");
    setActionError(false);

    if (!requireLogin()) return;
    if (!listing || isOwnListing || !isAvailable) return;

    try {
      setCartLoading(true);

      await apiRequest("/cart", {
        method: "POST",
        body: JSON.stringify({
          listingId: listing.id,
          quantity: 1,
        }),
      });

      setActionMessage("Added to your cart!");
    } catch (err) {
      setActionError(true);
      setActionMessage(
        err.message || "Could not add to cart."
      );
    } finally {
      setCartLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="product-page">
        <div className="product-container">
          <div className="product-message">
            <div className="product-spinner" />
            <p>Loading product details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="product-page">
        <div className="product-container">
          <div className="product-error">
            <h2>Unable to load product</h2>
            <p role="alert">
              {error || "Product not found."}
            </p>
            <Link
              className="product-button product-button-primary"
              to="/marketplace"
            >
              ← Back to Marketplace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const conditionLabels = {
    NEW: "New",
    LIKE_NEW: "Like New",
    GOOD: "Good",
    FAIR: "Fair",
  };

  const statusLabels = {
    AVAILABLE: "Available",
    RESERVED: "Reserved",
    EXCHANGED: "Exchanged",
    REMOVED: "Removed",
  };

  const isAvailable = listing.status === "AVAILABLE";

  const isOwnListing =
    Boolean(currentUser?.id) &&
    String(listing.sellerId) === String(currentUser.id);

  return (
    <div className="product-page">
      <header className="product-header">
        <div className="product-header-inner">
          <Link to="/marketplace" className="product-brand">
            <span className="product-brand-mark">C</span>
            CampusX
          </Link>

          <div className="product-header-actions">
            <Link
              to="/wishlist"
              className="product-header-icon-link"
            >
              <span aria-hidden="true">♡</span>
              <span>Wishlist</span>
            </Link>

            <Link
              to="/cart"
              className="product-header-icon-link"
            >
              <span aria-hidden="true">🛒</span>
              <span>Cart</span>
            </Link>

            <Link
              to="/marketplace"
              className="product-back-link"
            >
              ← Continue browsing
            </Link>
          </div>
        </div>
      </header>

      <main className="product-container">
        <nav
          className="product-breadcrumb"
          aria-label="Breadcrumb"
        >
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/marketplace">Marketplace</Link>
          <span>/</span>
          <span className="product-breadcrumb-current">
            {listing.title}
          </span>
        </nav>

        <section className="product-layout">
          <div className="product-image-panel">
            <div className="product-main-image">
              {listing.imageUrl && !imageError ? (
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="product-image-placeholder">
                  <span className="product-placeholder-icon">
                    ▧
                  </span>
                  <p>
                    {imageError
                      ? "Product image unavailable"
                      : "No image available"}
                  </p>
                </div>
              )}
            </div>

            <div className="product-image-caption">
              <span>CampusX Marketplace</span>
              <span>Student-to-student selling</span>
            </div>
          </div>

          <div className="product-info">
            <div className="product-category">
              {listing.category?.name || "Campus product"}
            </div>

            <div className="product-status-row">
              <span
                className={`product-status ${
                  isAvailable
                    ? "product-status-available"
                    : "product-status-other"
                }`}
              >
                <span className="product-status-dot" />
                {statusLabels[listing.status] || listing.status}
              </span>

              <span className="product-condition">
                {conditionLabels[listing.condition] ||
                  listing.condition}
              </span>
            </div>

            <h1 className="product-title">{listing.title}</h1>

            <p className="product-price">
              {formatCurrency(listing.price)}
            </p>

            <p className="product-price-note">
              Pay the seller when collecting the product on campus.
            </p>

            <div className="product-divider" />

            <section className="product-description-section">
              <h2>About this product</h2>
              <p>
                {listing.description || "No description provided."}
              </p>
            </section>

            <section className="product-seller-card">
              <div className="product-seller-avatar">
                {(listing.seller?.name || "S")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="product-seller-info">
                <span className="product-seller-label">
                  Listed by
                </span>
                <h2>
                  {listing.seller?.name || "Campus student"}
                </h2>
                {listing.seller?.department && (
                  <p>{listing.seller.department} department</p>
                )}
              </div>
            </section>

            {!userLoading && !isOwnListing && (
              <section className="product-shopping-actions">
                <h2>Interested in this product?</h2>

                {actionMessage && (
                  <div
                    className={
                      actionError
                        ? "product-action-feedback product-action-feedback-error"
                        : "product-action-feedback"
                    }
                    role={actionError ? "alert" : "status"}
                  >
                    {actionMessage}
                  </div>
                )}

                <div className="product-shopping-button-row">
                  <button
                    type="button"
                    className="product-button product-button-primary product-cart-button"
                    onClick={handleAddToCart}
                    disabled={!isAvailable || cartLoading}
                  >
                    {cartLoading
                      ? "Adding..."
                      : "🛒 Add to Cart"}
                  </button>

                  <button
                    type="button"
                    className="product-button product-button-secondary product-wishlist-button"
                    onClick={handleAddToWishlist}
                    disabled={wishlistLoading}
                  >
                    <span aria-hidden="true">
                      {isWishlisted ? "♥" : "♡"}
                    </span>
                    {wishlistLoading
                      ? "Adding..."
                      : isWishlisted
                        ? "In Wishlist"
                        : "Add to Wishlist"}
                  </button>
                </div>

                {!isAvailable && (
                  <p className="product-action-note">
                    This product is not currently available to add
                    to cart.
                  </p>
                )}
              </section>
            )}

            {userLoading && (
              <section className="product-shopping-actions">
                <p>Checking your login...</p>
              </section>
            )}

            {!userLoading && isOwnListing && (
              <section className="product-offer-card">
                <h2>This is your listing</h2>
                <p>
                  You cannot buy your own product. You can manage
                  this listing from My Listings.
                </p>
                <Link
                  to="/my-listings"
                  className="product-button product-button-primary"
                >
                  Manage My Listings →
                </Link>
              </section>
            )}

            <div className="product-actions">
              <Link
                to="/marketplace"
                className="product-button product-button-secondary"
              >
                Continue Browsing
              </Link>
            </div>

            <div className="product-trust-note">
              <span aria-hidden="true">✓</span>
              <p>
                Connect with fellow students and arrange collection
                on campus.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
