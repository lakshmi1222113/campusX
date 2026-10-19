
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

export default function Navbar() {
  const { user, token, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  const notificationRef = useRef(null);

  async function notificationRequest(path, options = {}) {
    const response = await fetch(`${API_URL}/notifications${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || "Unable to load notifications.");
    }

    return result;
  }

  async function loadUnreadCount() {
    if (!token || !isAuthenticated) return;

    try {
      const result = await notificationRequest("/unread-count");
      setUnreadCount(result.count || 0);
    } catch (error) {
      console.error("Unable to load unread notification count:", error);
    }
  }

  async function loadNotifications() {
    if (!token || !isAuthenticated) return;

    setNotificationLoading(true);
    setNotificationError("");

    try {
      const [listResult, countResult] = await Promise.all([
        notificationRequest(""),
        notificationRequest("/unread-count"),
      ]);

      setNotifications(listResult.data || []);
      setUnreadCount(countResult.count || 0);
    } catch (error) {
      setNotificationError(error.message);
    } finally {
      setNotificationLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setNotifications([]);
      setUnreadCount(0);
      setNotificationOpen(false);
      return;
    }

    loadUnreadCount();

    const intervalId = window.setInterval(loadUnreadCount, 30000);

    return () => window.clearInterval(intervalId);
  }, [token, isAuthenticated]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function handleLogout() {
    logout();
    setNotifications([]);
    setUnreadCount(0);
    setNotificationOpen(false);
    navigate("/");
  }

  function handleProtectedNavigation(path, feature) {
    if (!token || !isAuthenticated) {
      window.alert(`Please log in to access ${feature}.`);
      navigate("/login");
      return;
    }

    navigate(path);
  }

  async function handleNotificationBell() {
    const nextOpen = !notificationOpen;
    setNotificationOpen(nextOpen);

    if (nextOpen) {
      await loadNotifications();
    }
  }

  async function handleNotificationClick(notification) {
    setNotificationOpen(false);

    if (!notification.isRead) {
      try {
        await notificationRequest(`/${notification.id}/read`, {
          method: "PATCH",
        });

        setNotifications((previous) =>
          previous.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item
          )
        );

        setUnreadCount((previous) => Math.max(0, previous - 1));
      } catch (error) {
        console.error("Unable to mark notification as read:", error);
      }
    }

    if (notification.listingId) {
      navigate(`/listings/${notification.listingId}`);
    } else if (notification.wantedItemId) {
      navigate("/my-wanted-items");
    }
  }

  async function handleMarkAllRead() {
    try {
      await notificationRequest("/read-all", { method: "PATCH" });

      setNotifications((previous) =>
        previous.map((item) => ({ ...item, isRead: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      setNotificationError(error.message);
    }
  }

  function formatNotificationDate(dateValue) {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <header className="navbar">
      <Link className="brand" to="/">
        <span className="brand-icon">C</span>
        CampusX
      </Link>

      <nav>
        <Link to="/marketplace">Marketplace</Link>
        <Link to="/wanted-items">Wanted Items</Link>
      </nav>

      <div className="nav-auth">
        <button
          type="button"
          className="nav-icon-btn"
          aria-label="Wishlist"
          title="Wishlist"
          onClick={() =>
            handleProtectedNavigation("/wishlist", "your wishlist")
          }
        >
          <svg
            width="23"
            height="23"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
          </svg>
        </button>

        <button
          type="button"
          className="nav-icon-btn"
          aria-label="Shopping cart"
          title="Shopping cart"
          onClick={() => handleProtectedNavigation("/cart", "your cart")}
        >
          <svg
            width="23"
            height="23"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
          </svg>
        </button>

        {isAuthenticated && user && (
          <div className="notification-wrapper" ref={notificationRef}>
            <button
              type="button"
              className="nav-icon-btn notification-bell-btn"
              aria-label={`Notifications, ${unreadCount} unread`}
              title="Notifications"
              aria-expanded={notificationOpen}
              onClick={handleNotificationBell}
              style={{ position: "relative" }}
            >
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>

              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <strong>Notifications</strong>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="notification-mark-all"
                      onClick={handleMarkAllRead}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {notificationLoading ? (
                  <p className="notification-empty">Loading notifications...</p>
                ) : notificationError ? (
                  <p className="notification-empty notification-error">
                    {notificationError}
                  </p>
                ) : notifications.length === 0 ? (
                  <p className="notification-empty">
                    No notifications yet.
                  </p>
                ) : (
                  <div className="notification-list">
                    {notifications.map((notification) => (
                      <button
                        type="button"
                        key={notification.id}
                        className={`notification-item ${
                          notification.isRead ? "" : "unread"
                        }`}
                        onClick={() =>
                          handleNotificationClick(notification)
                        }
                      >
                        <span className="notification-item-title">
                          {!notification.isRead && (
                            <span className="notification-unread-dot" />
                          )}
                          {notification.title}
                        </span>

                        <span className="notification-message">
                          {notification.message}
                        </span>

                        <span className="notification-date">
                          {formatNotificationDate(notification.createdAt)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isAuthenticated && user ? (
          <>
            <Link
              to="/profile"
              className="profile-icon-btn"
              aria-label="My Profile"
              title="My Profile"
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
              </svg>
            </Link>

            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <Link className="login-btn" to="/login">
            Student Login
          </Link>
        )}
      </div>
    </header>
  );
}
