const express = require("express");
const router = express.Router();
const {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
} = require("../controllers/notificationController");
const { protect } = require("../middlewares/authMiddleware");

// All routes require authentication
router.use(protect);

router.get("/", getUserNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/read-all", markAllAsRead);
router.delete("/clear-read", clearReadNotifications);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
