
const db = require("../config/db");

const logActivity = async ({
  user_id = null,
  action,
  details = null,
  ip_address = null,
  user_agent = null
}) => {
  try {
    await db.execute(
      `INSERT INTO audit_logs
       (user_id, action, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, action, details, ip_address, user_agent]
    );
  } catch (error) {
    console.error("Audit logging error:", error.message);
  }
};

module.exports = logActivity;
