
const express = require("express");
const router = express.Router();

const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require("../controllers/notificationController");

const { authenticate } = require("../middleware/authMiddleware");

router.use(authenticate);

router.get("/", getNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:notificationId/read", markNotificationRead);

module.exports = router;
