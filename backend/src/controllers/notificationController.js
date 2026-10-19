
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

// Get notifications for the logged-in student
const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          status: true,
        },
      },
      wantedItem: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  res.json({
    success: true,
    count: notifications.length,
    data: notifications,
  });
});

// Get unread notification count
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await prisma.notification.count({
    where: {
      userId: req.user.id,
      isRead: false,
    },
  });

  res.json({
    success: true,
    count,
  });
});

// Mark one notification as read
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await prisma.notification.findFirst({
    where: {
      id,
      userId: req.user.id,
    },
  });

  if (!notification) {
    throw new HttpError(404, "Notification not found");
  }

  const updatedNotification = await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true },
  });

  res.json({
    success: true,
    message: "Notification marked as read",
    data: updatedNotification,
  });
});

// Mark all notifications as read
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await prisma.notification.updateMany({
    where: {
      userId: req.user.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  res.json({
    success: true,
    message: "All notifications marked as read",
    updatedCount: result.count,
  });
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
