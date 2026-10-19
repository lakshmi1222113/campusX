
const express = require("express");
const cors = require("cors");
const prisma = require("./config/prisma");
const path = require("path");

const cartRoutes = require("./routes/cartRoutes");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const listingRoutes = require("./routes/listingRoutes");
const wantedItemRoutes = require("./routes/wantedItemRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const orderRoutes = require("./routes/orderRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const {
  notFound,
  errorHandler,
} = require("./middleware/errorMiddleware");

const app = express();

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

// CORS configuration - must be before API routes
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON request bodies
app.use(express.json({ limit: "1mb" }));

// Home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to CampusX API!",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "Server is running",
    project: "CampusX",
  });
});

// Database connection test
app.get("/api/db-test", async (req, res, next) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT current_database() AS database, NOW() AS server_time
    `;

    res.json({
      success: true,
      message: "Prisma connected successfully!",
      data: result[0],
    });
  } catch (error) {
    next(error);
  }
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/wanted-items", wantedItemRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);

// Handle unknown routes
app.use(notFound);

// Central error handler - keep this last
app.use(errorHandler);

module.exports = app;
