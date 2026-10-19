
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";
import { formatCurrency } from "../utils/formatCurrency";
import "./CartPage.css";

export default function CartPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pickupLocation, setPickupLocation] = useState("");
  const [buyerNote, setBuyerNote] = useState("");

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/cart");
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.message || "Unable to load your cart.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  async function removeItem(id) {
    setBusyId(id);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/cart/${id}`, { method: "DELETE" });

      setItems((current) => current.filter((item) => item.id !== id));
      setMessage("Product removed from cart.");
    } catch (err) {
      setError(err.message || "Unable to remove product.");
    } finally {
      setBusyId("");
    }
  }

  async function placeOrder(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!localStorage.getItem("campusx_token")) {
      navigate("/login");
      return;
    }

    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    if (!pickupLocation.trim()) {
      setError("Please enter a pickup location.");
      return;
    }

    setCheckoutLoading(true);

    try {
      await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify({
          pickupLocation: pickupLocation.trim(),
          buyerNote: buyerNote.trim(),
        }),
      });

      setItems([]);
      setCheckoutOpen(false);

      navigate("/my-orders", {
        state: { message: "Order placed successfully!" },
      });
    } catch (err) {
      setError(err.message || "Unable to place your order.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  // Each cart entry represents one item.
  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.listing?.price || 0),
        0
      ),
    [items]
  );

  const totalQuantity = items.length;

  if (loading) {
    return (
      <main className="cart-page">
        <div className="cart-container">
          <p className="cart-status">Loading your cart...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="cart-container">
        <header className="cart-header">
          <div>
            <p className="cart-eyebrow">CAMPUSX MARKETPLACE</p>
            <h1>My Cart</h1>
            <p>Review your items and get ready to order.</p>
          </div>

          <Link to="/marketplace" className="cart-secondary-button">
            ← Continue Shopping
          </Link>
        </header>

        {error && (
          <div className="cart-alert cart-alert-error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {message && (
          <div className="cart-alert" role="status">
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {items.length === 0 ? (
          <section className="cart-empty">
            <div className="cart-empty-icon" aria-hidden="true">
              🛒
            </div>
            <h2>Your cart is empty</h2>
            <p>
              Find something useful from students on your campus.
            </p>
            <Link to="/marketplace" className="cart-primary-button">
              Explore Marketplace →
            </Link>
            <Link to="/my-orders" className="cart-orders-link">
              View My Orders
            </Link>
          </section>
        ) : (
          <div className="cart-layout">
            <section className="cart-items">
              <div className="cart-section-heading">
                <div>
                  <h2>Your products</h2>
                  <p>{items.length} item types in your cart</p>
                </div>
                <span className="cart-count-badge">
                  {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="cart-item-list">
                {items.map((item) => {
                  const listing = item.listing;

                  if (!listing) return null;

                  return (
                    <article className="cart-item" key={item.id}>
                      <Link
                        to={`/listings/${listing.id}`}
                        className="cart-item-image"
                        aria-label={`View ${listing.title}`}
                      >
                        {listing.imageUrl ? (
                          <img
                            src={listing.imageUrl}
                            alt={listing.title}
                          />
                        ) : (
                          <span className="cart-no-image">
                            <span aria-hidden="true">📦</span>
                            No image
                          </span>
                        )}
                      </Link>

                      <div className="cart-item-info">
                        <p className="cart-item-category">
                          {listing.category?.name || "Campus product"}
                        </p>

                        <h3>
                          <Link to={`/listings/${listing.id}`}>
                            {listing.title}
                          </Link>
                        </h3>

                        <p className="cart-item-unit-price">
                          {formatCurrency(Number(listing.price))}
                        </p>

                        <div className="cart-item-actions">
                          <span className="cart-single-quantity">
                            Quantity: 1
                          </span>

                          <button
                            type="button"
                            className="cart-remove-button"
                            disabled={busyId === item.id}
                            onClick={() => removeItem(item.id)}
                          >
                            {busyId === item.id
                              ? "Please wait..."
                              : "Remove"}
                          </button>
                        </div>
                      </div>

                      <div className="cart-item-subtotal">
                        <span>Subtotal</span>
                        <strong>
                          {formatCurrency(Number(listing.price))}
                        </strong>
                      </div>
                    </article>
                  );
                })}
              </div>

              <Link to="/marketplace" className="cart-continue-link">
                ← Add more products
              </Link>
            </section>

            <aside className="cart-summary">
              <div className="cart-summary-heading">
                <span className="cart-summary-icon" aria-hidden="true">
                  <span>✓</span>
                </span>
                <div>
                  <h2>Order Summary</h2>
                  <p>Review before placing your order</p>
                </div>
              </div>

              <div className="cart-summary-row">
                <span>Product types</span>
                <strong>{items.length}</strong>
              </div>

              <div className="cart-summary-row">
                <span>Total items</span>
                <strong>{totalQuantity}</strong>
              </div>

              <div className="cart-summary-row">
                <span>Collection payment</span>
                <strong>Cash</strong>
              </div>

              <div className="cart-summary-total">
                <span>Total amount</span>
                <strong>{formatCurrency(total)}</strong>
              </div>

              <p className="cart-summary-note">
                Pay when you collect your products from the seller.
              </p>

              {!checkoutOpen ? (
                <button
                  type="button"
                  className="cart-checkout-button"
                  onClick={() => {
                    setError("");
                    setCheckoutOpen(true);
                  }}
                >
                  Proceed to Checkout →
                </button>
              ) : (
                <form
                  className="cart-checkout-form"
                  onSubmit={placeOrder}
                >
                  <h3>Pickup details</h3>

                  <label htmlFor="pickupLocation">
                    Pickup location <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="pickupLocation"
                    type="text"
                    value={pickupLocation}
                    onChange={(event) =>
                      setPickupLocation(event.target.value)
                    }
                    placeholder="e.g. College main gate"
                    maxLength={200}
                    required
                  />

                  <label htmlFor="buyerNote">
                    Note to seller <span>(optional)</span>
                  </label>
                  <textarea
                    id="buyerNote"
                    value={buyerNote}
                    onChange={(event) =>
                      setBuyerNote(event.target.value)
                    }
                    placeholder="Any details for the seller..."
                    maxLength={1000}
                    rows={3}
                  />

                  <button
                    type="submit"
                    className="cart-checkout-button"
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading
                      ? "Placing Order..."
                      : "Confirm & Place Order"}
                  </button>

                  <button
                    type="button"
                    className="cart-secondary-button cart-checkout-cancel"
                    disabled={checkoutLoading}
                    onClick={() => setCheckoutOpen(false)}
                  >
                    Back to Summary
                  </button>
                </form>
              )}

              <p className="cart-secure-note">
                Orders are managed through your CampusX account.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
