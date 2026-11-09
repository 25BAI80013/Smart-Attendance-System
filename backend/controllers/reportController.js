const db = require("../config/db");

const getReportOverview = async (req, res, next) => {
  try {
    const { start_date, end_date, class_id, subject_id } = req.query;

    if (
      (start_date && !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) ||
      (end_date && !/^\d{4}-\d{2}-\d{2}$/.test(end_date))
    ) {
      return res.status(400).json({
        success: false,
        message: "Dates must use YYYY-MM-DD format."
      });
    }

    if (start_date && end_date && start_date > end_date) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date."
      });
    }

    const filters = [];
    const params = [];

    if (start_date) {
      filters.push("ses.session_date >= ?");
      params.push(start_date);
    }

    if (end_date) {
      filters.push("ses.session_date <= ?");
      params.push(end_date);
    }

    if (class_id) {
      filters.push("ses.class_id = ?");
      params.push(class_id);
    }

    if (subject_id) {
      filters.push("ses.subject_id = ?");
      params.push(subject_id);
    }

    const whereClause = filters.length
      ? `WHERE ${filters.join(" AND ")}`
      : "";

    const [summaryRows] = await db.query(
      `SELECT
        COUNT(DISTINCT ses.session_id) AS total_sessions,
        COUNT(ar.record_id) AS total_records,
        COALESCE(SUM(ar.status = 'present'), 0) AS present_count,
        COALESCE(SUM(ar.status = 'absent'), 0) AS absent_count,
        ROUND(
          100.0 * COALESCE(SUM(ar.status = 'present'), 0) /
          NULLIF(COUNT(ar.record_id), 0), 2
        ) AS overall_percentage
       FROM attendance_sessions ses
       LEFT JOIN attendance_records ar ON ar.session_id = ses.session_id
       ${whereClause}`,
      params
    );

    const [classReports] = await db.query(
      `SELECT
        c.class_id,
        c.class_name,
        c.section,
        COUNT(ar.record_id) AS total_records,
        COALESCE(SUM(ar.status = 'present'), 0) AS present_count,
        COALESCE(SUM(ar.status = 'absent'), 0) AS absent_count,
        ROUND(
          100.0 * COALESCE(SUM(ar.status = 'present'), 0) /
          NULLIF(COUNT(ar.record_id), 0), 2
        ) AS attendance_percentage
       FROM attendance_sessions ses
       JOIN classes c ON c.class_id = ses.class_id
       LEFT JOIN attendance_records ar ON ar.session_id = ses.session_id
       ${whereClause}
       GROUP BY c.class_id, c.class_name, c.section
       ORDER BY c.class_name, c.section`,
      params
    );

    const [subjectReports] = await db.query(
      `SELECT
        sub.subject_id,
        sub.subject_name,
        sub.subject_code,
        COUNT(ar.record_id) AS total_records,
        COALESCE(SUM(ar.status = 'present'), 0) AS present_count,
        COALESCE(SUM(ar.status = 'absent'), 0) AS absent_count,
        ROUND(
          100.0 * COALESCE(SUM(ar.status = 'present'), 0) /
          NULLIF(COUNT(ar.record_id), 0), 2
        ) AS attendance_percentage
       FROM attendance_sessions ses
       JOIN subjects sub ON sub.subject_id = ses.subject_id
       LEFT JOIN attendance_records ar ON ar.session_id = ses.session_id
       ${whereClause}
       GROUP BY sub.subject_id, sub.subject_name, sub.subject_code
       ORDER BY sub.subject_name`,
      params
    );

    const [lowAttendanceStudents] = await db.query(
      `SELECT
        st.student_id,
        st.uid,
        u.name AS student_name,
        c.class_name,
        c.section,
        sub.subject_id,
        sub.subject_name,
        sub.subject_code,
        COUNT(ar.record_id) AS total_classes,
        COALESCE(SUM(ar.status = 'present'), 0) AS present_classes,
        COALESCE(SUM(ar.status = 'absent'), 0) AS absent_classes,
        ROUND(
          100.0 * COALESCE(SUM(ar.status = 'present'), 0) /
          NULLIF(COUNT(ar.record_id), 0), 2
        ) AS attendance_percentage
       FROM enrollments e
       JOIN students st ON st.student_id = e.student_id
       JOIN users u ON u.user_id = st.user_id
       JOIN classes c ON c.class_id = e.class_id
       JOIN subjects sub ON sub.subject_id = e.subject_id
       JOIN attendance_sessions ses
         ON ses.class_id = e.class_id
        AND ses.subject_id = e.subject_id
       JOIN attendance_records ar
         ON ar.session_id = ses.session_id
        AND ar.student_id = st.student_id
       ${whereClause}
       GROUP BY
         st.student_id, st.uid, u.name,
         c.class_name, c.section,
         sub.subject_id, sub.subject_name, sub.subject_code
       HAVING attendance_percentage < 75
       ORDER BY attendance_percentage ASC, u.name ASC`,
      params
    );

    res.json({
      success: true,
      summary: summaryRows[0],
      classReports,
      subjectReports,
      lowAttendanceStudents
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getReportOverview };