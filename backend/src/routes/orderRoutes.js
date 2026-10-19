
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/authMiddleware");

const {
  getMyOrders,
  getSellerOrders,
  createOrder,
  updateOrderStatus,
  proposePickupSchedule,
  confirmPickupSchedule,
  requestPickupReschedule,
  markReadyForPickup,
  markCollected,
  cancelOrder,
} = require("../controllers/orderController");

const router = express.Router();

router.use(protect);

// Buyer routes
router.get("/mine", asyncHandler(getMyOrders));
router.post("/", asyncHandler(createOrder));
router.patch("/:id/cancel", asyncHandler(cancelOrder));
router.patch("/:id/confirm-pickup", asyncHandler(confirmPickupSchedule));
router.patch("/:id/request-reschedule", asyncHandler(requestPickupReschedule));

// Seller routes
router.get("/seller", asyncHandler(getSellerOrders));
router.patch("/:id/status", asyncHandler(updateOrderStatus));
router.patch("/:id/pickup-schedule", asyncHandler(proposePickupSchedule));
router.patch("/:id/ready", asyncHandler(markReadyForPickup));
router.patch("/:id/collected", asyncHandler(markCollected));

module.exports = router;
