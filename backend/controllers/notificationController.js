
const db = require("../config/db");

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const [notifications] = await db.query(
      `SELECT
          notification_id,
          title,
          message,
          notification_type,
          is_read,
          created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId]
    );

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS unread_count
       FROM notifications
       WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unread_count: countRows[0].unread_count,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { notificationId } = req.params;

    const [result] = await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE notification_id = ? AND user_id = ?`,
      [notificationId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read."
    });
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read."
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
