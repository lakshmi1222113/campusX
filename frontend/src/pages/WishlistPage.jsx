
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import { formatCurrency } from "../utils/formatCurrency";
import "./WishlistPage.css";
export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadWishlist() {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/wishlist");
      setItems(response.data || []);
    } catch (err) {
      setError(err.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWishlist();
  }, []);

  async function removeItem(id) {
    try {
      await apiRequest(`/wishlist/${id}`, { method: "DELETE" });
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message || "Failed to remove item");
    }
  }

  if (loading) return <div className="wishlist-page"><p>Loading wishlist...</p></div>;

  return (
    <main className="wishlist-page">
      <header className="wishlist-header">
        <div>
          <h1>My Wishlist</h1>
          <p>Products you have saved for later.</p>
        </div>
        <Link to="/marketplace" className="wishlist-back-link">
          Browse Marketplace
        </Link>
      </header>

      {error && <p className="wishlist-error">{error}</p>}

      {items.length === 0 ? (
        <section className="wishlist-empty">
          <h2>Your wishlist is empty</h2>
          <p>Explore the marketplace and save products you like.</p>
          <Link to="/marketplace" className="wishlist-primary-button">
            Explore Marketplace
          </Link>
        </section>
      ) : (
        <section className="wishlist-grid">
          {items.map((item) => {
            const listing = item.listing;

            return (
              <article className="wishlist-card" key={item.id}>
                <Link
                  to={`/listings/${listing.id}`}
                  className="wishlist-image"
                >
                  {listing.imageUrl ? (
                    <img src={listing.imageUrl} alt={listing.title} />
                  ) : (
                    <span>No image available</span>
                  )}
                </Link>

                <div className="wishlist-card-content">
                  <h2>
                    <Link to={`/listings/${listing.id}`}>
                      {listing.title}
                    </Link>
                  </h2>

                  <p className="wishlist-price">
                    {formatCurrency(Number(listing.price))}
                  </p>

                  <p className="wishlist-meta">
                    {listing.category?.name || "Uncategorized"}
                  </p>

                  <p className="wishlist-meta">
                    Seller: {listing.seller?.name || "Unknown"}
                  </p>

                  <div className="wishlist-actions">
                    <Link
                      to={`/listings/${listing.id}`}
                      className="wishlist-primary-button"
                    >
                      View Product
                    </Link>
                    <button
                      type="button"
                      className="wishlist-remove-button"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
