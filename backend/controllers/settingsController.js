const db = require("../config/db");
const auditLogger = require("../utils/auditLogger");

// GET SYSTEM SETTINGS
exports.getSettings = async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
        setting_id,
        institution_name,
        academic_year,
        current_semester,
        attendance_threshold,
        low_attendance_alerts,
        email_notifications,
        updated_at
       FROM system_settings
       WHERE setting_id = 1`
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "System settings not found"
      });
    }

    res.json({
      success: true,
      settings: rows[0]
    });

  } catch (error) {
    console.error("Get settings error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch system settings"
    });
  }
};


// UPDATE SYSTEM SETTINGS
exports.updateSettings = async (req, res) => {
  try {
    const {
      institution_name,
      academic_year,
      current_semester,
      attendance_threshold,
      low_attendance_alerts,
      email_notifications
    } = req.body;

    if (
      typeof institution_name !== "string" ||
      !institution_name.trim() ||
      institution_name.trim().length > 150
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid institution name is required"
      });
    }

    if (
      typeof academic_year !== "string" ||
      !/^\d{4}-\d{4}$/.test(academic_year)
    ) {
      return res.status(400).json({
        success: false,
        message: "Academic year must be in YYYY-YYYY format"
      });
    }

    const yearParts = academic_year.split("-").map(Number);

    if (yearParts[1] !== yearParts[0] + 1) {
      return res.status(400).json({
        success: false,
        message: "Academic year must contain consecutive years"
      });
    }

    if (
      !Number.isInteger(Number(current_semester)) ||
      Number(current_semester) < 1 ||
      Number(current_semester) > 12
    ) {
      return res.status(400).json({
        success: false,
        message: "Semester must be between 1 and 12"
      });
    }

    if (
      !Number.isFinite(Number(attendance_threshold)) ||
      Number(attendance_threshold) < 0 ||
      Number(attendance_threshold) > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Attendance threshold must be between 0 and 100"
      });
    }

    if (
      typeof low_attendance_alerts !== "boolean" ||
      typeof email_notifications !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Notification settings must be true or false"
      });
    }

    await db.execute(
      `INSERT INTO system_settings (
        setting_id,
        institution_name,
        academic_year,
        current_semester,
        attendance_threshold,
        low_attendance_alerts,
        email_notifications,
        updated_by
      )
      VALUES (1, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        institution_name = VALUES(institution_name),
        academic_year = VALUES(academic_year),
        current_semester = VALUES(current_semester),
        attendance_threshold = VALUES(attendance_threshold),
        low_attendance_alerts = VALUES(low_attendance_alerts),
        email_notifications = VALUES(email_notifications),
        updated_by = VALUES(updated_by)`,
      [
        institution_name.trim(),
        academic_year,
        Number(current_semester),
        Number(attendance_threshold),
        low_attendance_alerts,
        email_notifications,
        req.user.user_id
      ]
    );

    await auditLogger(req, "SYSTEM_SETTINGS_UPDATED", {
      institution_name: institution_name.trim(),
      academic_year,
      current_semester: Number(current_semester),
      attendance_threshold: Number(attendance_threshold)
    });

    res.json({
      success: true,
      message: "System settings updated successfully"
    });

  } catch (error) {
    console.error("Update settings error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update system settings"
    });
  }
};