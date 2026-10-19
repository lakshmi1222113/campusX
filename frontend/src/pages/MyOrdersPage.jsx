
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiRequest } from "../services/api";
import { formatCurrency } from "../utils/formatCurrency";
import "./MyOrdersPage.css";

const statusLabels = {
  PLACED: "Waiting for seller",
  ACCEPTED: "Accepted",
  READY_FOR_PICKUP: "Ready for pickup",
  COLLECTED: "Collected",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const scheduleLabels = {
  PROPOSED: "Waiting for your confirmation",
  CONFIRMED: "Pickup confirmed",
  RESCHEDULE_REQUESTED: "Waiting for seller to propose another time",
};

function formatDateTime(value) {
  if (!value) return "Not scheduled";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getProductImage(item) {
  return item.listing?.imageUrl || item.imageUrl || "";
}

export default function MyOrdersPage() {
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const [busyId, setBusyId] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/orders/mine");
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.message || "Unable to load your orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleScheduleAction(order, action) {
    const isConfirm = action === "confirm-pickup";

    if (
      !isConfirm &&
      !window.confirm("Would you like to request a different pickup time?")
    ) {
      return;
    }

    setBusyId(order.id);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/orders/${order.id}/${action}`, {
        method: "PATCH",
      });

      setMessage(
        isConfirm
          ? "Pickup date and time confirmed successfully."
          : "Reschedule request sent to the seller."
      );

      await loadOrders();
    } catch (err) {
      setError(err.message || "Unable to update the pickup schedule.");
    } finally {
      setBusyId("");
    }
  }

  async function cancelOrder(orderId) {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    setBusyId(orderId);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/orders/${orderId}/cancel`, {
        method: "PATCH",
      });

      setMessage("Order cancelled successfully.");
      await loadOrders();
    } catch (err) {
      setError(err.message || "Unable to cancel this order.");
    } finally {
      setBusyId("");
    }
  }

  if (loading) {
    return (
      <main className="my-orders-page">
        <div className="my-orders-container">
          <p className="orders-status">Loading your orders...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="my-orders-page">
      <div className="my-orders-container">
        <header className="my-orders-header">
          <div>
            <p className="orders-eyebrow">CAMPUSX MARKETPLACE</p>
            <h1>My Orders</h1>
            <p>Track your purchases and collection status.</p>
          </div>

          <Link to="/marketplace" className="orders-secondary-button">
            ← Marketplace
          </Link>
        </header>

        {message && (
          <div className="orders-alert" role="status">
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

        {error && (
          <div className="orders-alert orders-alert-error" role="alert">
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

        {orders.length === 0 ? (
          <section className="orders-empty">
            <div className="orders-empty-icon">🛍️</div>
            <h2>No orders yet</h2>
            <p>Your purchases will appear here after checkout.</p>
            <Link to="/marketplace" className="orders-primary-button">
              Explore Marketplace →
            </Link>
          </section>
        ) : (
          <section className="orders-list">
            {orders.map((order) => {
              const isBusy = busyId === order.id;
              const orderItems = order.items || [];

              return (
                <article className="order-card" key={order.id}>
                  <div className="order-card-header">
                    <div className="order-id-block">
                      <p className="order-label">ORDER ID</p>
                      <strong>{order.id}</strong>
                      <p className="order-placed-date">
                        Placed {formatDateTime(order.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`order-status order-status-${(
                        order.status || "PLACED"
                      ).toLowerCase()}`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>

                  <div className="order-card-layout">
                    {/* Left side: ordered products and images */}
                    <section className="order-products-panel">
                      <div className="order-panel-heading">
                        <h2>Products</h2>
                        <span>
                          {orderItems.length}{" "}
                          {orderItems.length === 1 ? "item" : "items"}
                        </span>
                      </div>

                      <div className="order-products">
                        {orderItems.map((item) => {
                          const imageUrl = getProductImage(item);

                          return (
                            <div className="order-product" key={item.id}>
                              <div className="order-product-image">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={item.title || "Ordered product"}
                                    loading="lazy"
                                  />
                                ) : (
                                  <span aria-hidden="true">📦</span>
                                )}
                              </div>

                              <div className="order-product-info">
                                <p className="order-product-title">
                                  {item.title}
                                </p>
                                <p className="order-product-quantity">
                                  Quantity: {item.quantity}
                                </p>
                                <p className="order-product-unit-price">
                                  {formatCurrency(Number(item.unitPrice))} each
                                </p>
                              </div>

                              <strong className="order-product-total">
                                {formatCurrency(
                                  Number(item.unitPrice) * item.quantity
                                )}
                              </strong>
                            </div>
                          );
                        })}
                      </div>

                      {order.buyerNote && (
                        <div className="order-note">
                          <strong>Your note to seller</strong>
                          <p>{order.buyerNote}</p>
                        </div>
                      )}
                    </section>

                    {/* Right side: order information and actions */}
                    <aside className="order-details-panel">
                      <div className="order-panel-heading">
                        <h2>Order Details</h2>
                      </div>

                      <div className="order-detail-row">
                        <span>Seller</span>
                        <strong>{order.seller?.name || "CampusX seller"}</strong>
                      </div>

                      {order.acceptedAt && (
                        <div className="order-detail-row">
                          <span>Accepted at</span>
                          <strong>{formatDateTime(order.acceptedAt)}</strong>
                        </div>
                      )}

                      <div className="order-detail-row">
                        <span>Pickup location</span>
                        <strong>
                          {order.pickupLocation || "To be confirmed"}
                        </strong>
                      </div>

                      <div className="order-detail-row">
                        <span>Payment method</span>
                        <strong>Cash on collection</strong>
                      </div>

                      <div className="order-detail-row">
                        <span>Payment status</span>
                        <strong
                          className={`payment-status payment-${(
                            order.paymentStatus || "PENDING"
                          ).toLowerCase()}`}
                        >
                          {order.paymentStatus || "PENDING"}
                        </strong>
                      </div>

                      {order.pickupScheduleStatus && (
                        <section className="pickup-schedule-card">
                          <h3>Pickup Schedule</h3>

                          <div className="schedule-detail">
                            <span>Date & time</span>
                            <strong>
                              {formatDateTime(order.pickupScheduledAt)}
                            </strong>
                          </div>

                          <div className="schedule-detail">
                            <span>Schedule status</span>
                            <strong>
                              {scheduleLabels[order.pickupScheduleStatus] ||
                                order.pickupScheduleStatus}
                            </strong>
                          </div>

                          {order.pickupConfirmedAt && (
                            <div className="schedule-detail">
                              <span>Confirmed at</span>
                              <strong>
                                {formatDateTime(order.pickupConfirmedAt)}
                              </strong>
                            </div>
                          )}

                          {order.status === "ACCEPTED" &&
                            order.pickupScheduleStatus === "PROPOSED" && (
                              <div className="pickup-schedule-actions">
                                <button
                                  type="button"
                                  className="orders-confirm-pickup-button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    handleScheduleAction(
                                      order,
                                      "confirm-pickup"
                                    )
                                  }
                                >
                                  {isBusy ? "Please wait..." : "Confirm Pickup"}
                                </button>

                                <button
                                  type="button"
                                  className="orders-reschedule-button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    handleScheduleAction(
                                      order,
                                      "request-reschedule"
                                    )
                                  }
                                >
                                  Request Reschedule
                                </button>
                              </div>
                            )}

                          {order.pickupScheduleStatus ===
                            "RESCHEDULE_REQUESTED" && (
                            <p className="pickup-waiting-message">
                              You requested another time. Please wait for the
                              seller to propose a new schedule.
                            </p>
                          )}
                        </section>
                      )}

                      <div className="order-card-footer">
                        <div>
                          <span>Total amount</span>
                          <strong>
                            {formatCurrency(Number(order.totalAmount))}
                          </strong>
                        </div>

                        {order.status === "PLACED" && (
                          <button
                            type="button"
                            className="orders-cancel-button"
                            disabled={isBusy}
                            onClick={() => cancelOrder(order.id)}
                          >
                            {isBusy ? "Please wait..." : "Cancel Order"}
                          </button>
                        )}
                      </div>
                    </aside>
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
