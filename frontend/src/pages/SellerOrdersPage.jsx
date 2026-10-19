
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import { formatCurrency } from "../utils/formatCurrency";
import "./SellerOrdersPage.css";

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [schedules, setSchedules] = useState({});

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/orders/seller");
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.message || "Unable to load seller orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  function updateSchedule(orderId, field, value) {
    setSchedules((current) => ({
      ...current,
      [orderId]: {
        ...current[orderId],
        [field]: value,
      },
    }));
  }

  async function updateOrderStatus(order, status) {
    const action = status === "ACCEPTED" ? "accept" : "reject";

    if (!window.confirm(`Are you sure you want to ${action} this order?`)) {
      return;
    }

    setBusyId(order.id);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setMessage(
        status === "ACCEPTED"
          ? "Order accepted! Now propose a pickup date and time."
          : "Order rejected."
      );

      await loadOrders();
    } catch (err) {
      setError(err.message || `Unable to ${action} order.`);
    } finally {
      setBusyId("");
    }
  }

  async function proposeSchedule(order) {
    const schedule = schedules[order.id] || {};

    // Use the edited location, or the buyer's existing pickup preference.
    const pickupLocation = (
      schedule.location ?? order.pickupLocation ?? ""
    ).trim();

    if (!schedule.dateTime || !pickupLocation) {
      setError("Select a pickup date, time, and location.");
      return;
    }

    const selectedDate = new Date(schedule.dateTime);

    if (
      Number.isNaN(selectedDate.getTime()) ||
      selectedDate <= new Date()
    ) {
      setError("Choose a pickup date and time in the future.");
      return;
    }

    setBusyId(order.id);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/orders/${order.id}/pickup-schedule`, {
        method: "PATCH",
        body: JSON.stringify({
          pickupScheduledAt: selectedDate.toISOString(),
          pickupLocation,
        }),
      });

      setMessage("Pickup schedule sent to the buyer.");
      await loadOrders();
    } catch (err) {
      setError(err.message || "Unable to propose pickup schedule.");
    } finally {
      setBusyId("");
    }
  }

  async function markReady(order) {
    setBusyId(order.id);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/orders/${order.id}/ready`, {
        method: "PATCH",
      });

      setMessage("Order marked ready for pickup.");
      await loadOrders();
    } catch (err) {
      setError(err.message || "Unable to update order.");
    } finally {
      setBusyId("");
    }
  }

  async function markCollected(order) {
    if (
      !window.confirm(
        "Confirm that the buyer collected the product and paid?"
      )
    ) {
      return;
    }

    setBusyId(order.id);
    setError("");
    setMessage("");

    try {
      await apiRequest(`/orders/${order.id}/collected`, {
        method: "PATCH",
      });

      setMessage("Order collection recorded successfully.");
      await loadOrders();
    } catch (err) {
      setError(err.message || "Unable to confirm collection.");
    } finally {
      setBusyId("");
    }
  }

  const statusLabels = {
    PLACED: "New order",
    ACCEPTED: "Accepted",
    READY_FOR_PICKUP: "Ready for pickup",
    COLLECTED: "Collected",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  };

  const scheduleLabels = {
    PROPOSED: "Waiting for buyer confirmation",
    CONFIRMED: "Pickup confirmed by buyer",
    RESCHEDULE_REQUESTED: "Buyer requested another time",
  };

  function formatDateTime(value) {
    if (!value) return "Not scheduled";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "Invalid date"
      : date.toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        });
  }

  if (loading) {
    return (
      <main className="seller-orders-page">
        <p className="seller-orders-status">Loading seller orders...</p>
      </main>
    );
  }

  return (
    <main className="seller-orders-page">
      <div className="seller-orders-container">
        <header className="seller-orders-header">
          <div>
            <p className="seller-orders-eyebrow">CAMPUSX MARKETPLACE</p>
            <h1>Seller Orders</h1>
            <p>Manage incoming orders and arrange product collection.</p>
          </div>

          <Link to="/profile" className="seller-orders-back">
            ← My Profile
          </Link>
        </header>

        {message && (
          <div className="seller-orders-alert" role="status">
            {message}
            <button type="button" onClick={() => setMessage("")}>
              ×
            </button>
          </div>
        )}

        {error && (
          <div
            className="seller-orders-alert seller-orders-error"
            role="alert"
          >
            {error}
            <button type="button" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        {!orders.length ? (
          <section className="seller-orders-empty">
            <div className="seller-orders-empty-icon">📦</div>
            <h2>No orders received yet</h2>
            <p>Orders placed for your listings will appear here.</p>
            <Link to="/marketplace" className="seller-orders-primary">
              Explore Marketplace
            </Link>
          </section>
        ) : (
          <section className="seller-orders-list">
            {orders.map((order) => {
              const isBusy = busyId === order.id;
              const schedule = schedules[order.id] || {};

              const canPropose =
                order.status === "ACCEPTED" &&
                order.pickupScheduleStatus !== "CONFIRMED";

              return (
                <article className="seller-order-card" key={order.id}>
                  <div className="seller-order-heading">
                    <div>
                      <p className="seller-order-label">ORDER ID</p>
                      <strong>{order.id}</strong>
                    </div>

                    <span
                      className={`seller-order-status seller-status-${order.status.toLowerCase()}`}
                    >
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>

                  <div className="seller-order-info">
                    <p>
                      <strong>Buyer:</strong>{" "}
                      {order.buyer?.name || "Campus student"}
                    </p>

                    <p>
                      <strong>Email:</strong>{" "}
                      {order.buyer?.email || "Not available"}
                    </p>

                    {["ACCEPTED", "READY_FOR_PICKUP"].includes(
                      order.status
                    ) && (
                      <p>
                        <strong>Buyer phone:</strong>{" "}
                        {order.buyer?.phoneNumber ? (
                          <>
                            <a href={`tel:${order.buyer.phoneNumber}`}>
                              {order.buyer.phoneNumber}
                            </a>{" "}
                            <a
                              href={`tel:${order.buyer.phoneNumber}`}
                              className="seller-call-buyer-link"
                              aria-label={`Call buyer ${
                                order.buyer.name || "student"
                              }`}
                            >
                              Call Buyer
                            </a>
                          </>
                        ) : (
                          <span>Not provided by buyer</span>
                        )}
                      </p>
                    )}

                    <p>
                      <strong>Order placed:</strong>{" "}
                      {formatDateTime(order.createdAt)}
                    </p>

                    <p>
                      <strong>Buyer pickup preference:</strong>{" "}
                      {order.pickupLocation || "Not provided"}
                    </p>

                    {order.acceptedAt && (
                      <p>
                        <strong>Accepted at:</strong>{" "}
                        {formatDateTime(order.acceptedAt)}
                      </p>
                    )}
                  </div>

                  <div className="seller-order-products">
                    {order.items?.map((item) => (
                      <div className="seller-order-product" key={item.id}>
                        <div>
                          <strong>{item.title}</strong>
                          <p>Quantity: {item.quantity}</p>
                        </div>

                        <strong>
                          {formatCurrency(
                            Number(item.unitPrice) * item.quantity
                          )}
                        </strong>
                      </div>
                    ))}
                  </div>

                  <div className="seller-order-total">
                    <span>Total amount</span>
                    <strong>
                      {formatCurrency(Number(order.totalAmount))}
                    </strong>
                  </div>

                  {order.buyerNote && (
                    <p className="seller-order-note">
                      <strong>Buyer note:</strong> {order.buyerNote}
                    </p>
                  )}

                  {order.status === "PLACED" && (
                    <div className="seller-order-actions">
                      <button
                        type="button"
                        className="seller-accept-button"
                        disabled={isBusy}
                        onClick={() =>
                          updateOrderStatus(order, "ACCEPTED")
                        }
                      >
                        {isBusy ? "Please wait..." : "Accept Order"}
                      </button>

                      <button
                        type="button"
                        className="seller-reject-button"
                        disabled={isBusy}
                        onClick={() =>
                          updateOrderStatus(order, "REJECTED")
                        }
                      >
                        Reject Order
                      </button>
                    </div>
                  )}

                  {order.pickupScheduleStatus && (
                    <div className="seller-schedule-summary">
                      <h3>Pickup Schedule</h3>

                      <p>
                        <strong>Date &amp; time:</strong>{" "}
                        {formatDateTime(order.pickupScheduledAt)}
                      </p>

                      <p>
                        <strong>Location:</strong>{" "}
                        {order.pickupLocation || "Not provided"}
                      </p>

                      <p>
                        <strong>Status:</strong>{" "}
                        {scheduleLabels[order.pickupScheduleStatus] ||
                          order.pickupScheduleStatus}
                      </p>
                    </div>
                  )}

                  {canPropose && (
                    <form
                      className="seller-schedule-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        proposeSchedule(order);
                      }}
                    >
                      <h3>
                        {order.pickupScheduleStatus ===
                        "RESCHEDULE_REQUESTED"
                          ? "Propose a new pickup time"
                          : "Schedule pickup"}
                      </h3>

                      <label htmlFor={`pickup-date-${order.id}`}>
                        Pickup date and time
                      </label>

                      <input
                        id={`pickup-date-${order.id}`}
                        type="datetime-local"
                        min={new Date(
                          Date.now() -
                            new Date().getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .slice(0, 16)}
                        value={schedule.dateTime || ""}
                        onChange={(event) =>
                          updateSchedule(
                            order.id,
                            "dateTime",
                            event.target.value
                          )
                        }
                        required
                      />

                      <label htmlFor={`pickup-location-${order.id}`}>
                        Pickup location
                      </label>

                      <input
                        id={`pickup-location-${order.id}`}
                        type="text"
                        maxLength={200}
                        value={
                          schedule.location ?? order.pickupLocation ?? ""
                        }
                        onChange={(event) =>
                          updateSchedule(
                            order.id,
                            "location",
                            event.target.value
                          )
                        }
                        placeholder="e.g. College main gate"
                        required
                      />

                      <button
                        type="submit"
                        className="seller-accept-button"
                        disabled={isBusy}
                      >
                        {isBusy ? "Sending..." : "Send Pickup Schedule"}
                      </button>
                    </form>
                  )}

                  {order.status === "ACCEPTED" &&
                    order.pickupScheduleStatus === "CONFIRMED" && (
                      <button
                        type="button"
                        className="seller-accept-button seller-full-button"
                        disabled={isBusy}
                        onClick={() => markReady(order)}
                      >
                        {isBusy
                          ? "Please wait..."
                          : "Mark Ready for Pickup"}
                      </button>
                    )}

                  {order.status === "READY_FOR_PICKUP" && (
                    <button
                      type="button"
                      className="seller-accept-button seller-full-button"
                      disabled={isBusy}
                      onClick={() => markCollected(order)}
                    >
                      {isBusy
                        ? "Please wait..."
                        : "Confirm Collected & Paid"}
                    </button>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
