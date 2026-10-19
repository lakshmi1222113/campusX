
const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/authMiddleware");

const {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notificationController");

const router = express.Router();

// All notification routes require login
router.use(protect);

router.get("/", asyncHandler(getNotifications));
router.get("/unread-count", asyncHandler(getUnreadCount));
router.patch("/read-all", asyncHandler(markAllNotificationsAsRead));
router.patch("/:id/read", asyncHandler(markNotificationAsRead));

module.exports = router;
