
const db = require("../config/db");

const getAuditLogs = async (req, res, next) => {
  try {
    const {
      action,
      user_id,
      start_date,
      end_date,
      page = 1,
      limit = 20
    } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (currentPage - 1) * pageSize;

    const filters = [];
    const params = [];

    if (action) {
      filters.push("a.action = ?");
      params.push(action);
    }

    if (user_id) {
      filters.push("a.user_id = ?");
      params.push(user_id);
    }

    if (start_date) {
      filters.push("DATE(a.created_at) >= ?");
      params.push(start_date);
    }

    if (end_date) {
      filters.push("DATE(a.created_at) <= ?");
      params.push(end_date);
    }

    const whereClause = filters.length
      ? `WHERE ${filters.join(" AND ")}`
      : "";

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM audit_logs a
       ${whereClause}`,
      params
    );

    const [logs] = await db.query(
      `SELECT
        a.log_id,
        a.user_id,
        u.name AS user_name,
        u.email,
        u.role,
        a.action,
        a.details,
        a.ip_address,
        a.user_agent,
        a.created_at
       FROM audit_logs a
       LEFT JOIN users u ON u.user_id = a.user_id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT ${pageSize} OFFSET ${offset}`,
      params
    );

    res.json({
      success: true,
      total: countRows[0].total,
      page: currentPage,
      limit: pageSize,
      total_pages: Math.ceil(countRows[0].total / pageSize),
      logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };
