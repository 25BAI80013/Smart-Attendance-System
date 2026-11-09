
const db = require("../config/db");

const validDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

const validId = (value) =>
  Number.isInteger(Number(value)) && Number(value) > 0;

const getTeacherId = async (userId) => {
  const [rows] = await db.execute(
    `SELECT teacher_id FROM teachers WHERE user_id = ?`,
    [userId]
  );

  return rows.length ? rows[0].teacher_id : null;
};

const checkAssignment = async (teacherId, classId, subjectId) => {
  const [rows] = await db.execute(
    `SELECT assignment_id
     FROM teacher_assignments
     WHERE teacher_id = ? AND class_id = ? AND subject_id = ?`,
    [teacherId, classId, subjectId]
  );

  return rows.length > 0;
};

const validateRecords = (records) => {
  if (!Array.isArray(records) || records.length === 0) {
    return "Attendance records must be a non-empty array";
  }

  const seen = new Set();

  for (const record of records) {
    if (!validId(record.student_id)) {
      return "Every attendance record must have a valid student_id";
    }

    if (!["present", "absent"].includes(record.status)) {
      return "Attendance status must be present or absent";
    }

    const studentId = Number(record.student_id);

    if (seen.has(studentId)) {
      return "Duplicate student found in attendance records";
    }

    seen.add(studentId);
  }

  return null;
};

const saveRecords = async (connection, sessionId, records) => {
  for (const record of records) {
    await connection.execute(
      `INSERT INTO attendance_records
       (session_id, student_id, status)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       marked_at = CURRENT_TIMESTAMP`,
      [sessionId, Number(record.student_id), record.status]
    );
  }
};

// GET TEACHER ASSIGNMENTS
exports.getTeacherAssignments = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req.user.user_id);

    if (!teacherId) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found"
      });
    }

    const [assignments] = await db.execute(
      `SELECT
        ta.assignment_id,
        ta.class_id,
        ta.subject_id,
        c.class_name,
        c.section,
        c.semester,
        c.department_id,
        s.subject_name,
        s.subject_code,
        d.department_name
       FROM teacher_assignments ta
       INNER JOIN classes c ON c.class_id = ta.class_id
       INNER JOIN subjects s ON s.subject_id = ta.subject_id
       INNER JOIN departments d ON d.department_id = c.department_id
       WHERE ta.teacher_id = ?
       ORDER BY c.class_name, c.section, s.subject_name`,
      [teacherId]
    );

    res.json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    console.error("Get teacher assignments error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch assigned classes"
    });
  }
};

// GET ENROLLED STUDENTS FOR CLASS AND SUBJECT
exports.getAttendanceStudents = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req.user.user_id);
    const classId = Number(req.params.classId);
    const subjectId = Number(req.params.subjectId);

    if (!teacherId) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found"
      });
    }

    if (!validId(classId) || !validId(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class or subject"
      });
    }

    const assigned = await checkAssignment(teacherId, classId, subjectId);

    if (!assigned) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this class and subject"
      });
    }

    const [students] = await db.execute(
      `SELECT
        s.student_id,
        s.uid,
        u.name,
        u.email,
        e.class_id,
        e.subject_id
       FROM enrollments e
       INNER JOIN students s ON s.student_id = e.student_id
       INNER JOIN users u ON u.user_id = s.user_id
       WHERE e.class_id = ?
         AND e.subject_id = ?
         AND u.is_active = 1
       ORDER BY u.name`,
      [classId, subjectId]
    );

    res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    console.error("Get attendance students error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch enrolled students"
    });
  }
};

// GET EXISTING ATTENDANCE SESSION
exports.getAttendanceSession = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req.user.user_id);
    const {
      class_id,
      subject_id,
      session_date,
      period_label
    } = req.query;

    if (
      !teacherId ||
      !validId(class_id) ||
      !validId(subject_id) ||
      !validDate(session_date) ||
      !period_label?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid class, subject, date and period are required"
      });
    }

    const assigned = await checkAssignment(
      teacherId,
      Number(class_id),
      Number(subject_id)
    );

    if (!assigned) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this class and subject"
      });
    }

    const [sessions] = await db.execute(
      `SELECT session_id, class_id, subject_id, teacher_id,
              session_date, period_label
       FROM attendance_sessions
       WHERE class_id = ?
         AND subject_id = ?
         AND session_date = ?
         AND period_label = ?
         AND teacher_id = ?`,
      [
        Number(class_id),
        Number(subject_id),
        session_date,
        period_label.trim(),
        teacherId
      ]
    );

    if (!sessions.length) {
      return res.json({
        success: true,
        exists: false,
        session: null,
        records: []
      });
    }

    const session = sessions[0];

    const [records] = await db.execute(
      `SELECT
        ar.record_id,
        ar.student_id,
        ar.status,
        ar.marked_at,
        s.uid,
        u.name
       FROM attendance_records ar
       INNER JOIN students s ON s.student_id = ar.student_id
       INNER JOIN users u ON u.user_id = s.user_id
       WHERE ar.session_id = ?
       ORDER BY u.name`,
      [session.session_id]
    );

    res.json({
      success: true,
      exists: true,
      session,
      records
    });
  } catch (error) {
    console.error("Get attendance session error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch attendance session"
    });
  }
};

// CREATE ATTENDANCE SESSION
exports.createAttendanceSession = async (req, res) => {
  const teacherId = await getTeacherId(req.user.user_id).catch(() => null);

  if (!teacherId) {
    return res.status(404).json({
      success: false,
      message: "Teacher profile not found"
    });
  }

  const {
    class_id,
    subject_id,
    session_date,
    period_label,
    records
  } = req.body;

  if (
    !validId(class_id) ||
    !validId(subject_id) ||
    !validDate(session_date) ||
    typeof period_label !== "string" ||
    !period_label.trim() ||
    period_label.trim().length > 30
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid class, subject, date and period label are required"
    });
  }

  const recordsError = validateRecords(records);

  if (recordsError) {
    return res.status(400).json({
      success: false,
      message: recordsError
    });
  }

  let connection;

  try {
    const assigned = await checkAssignment(
      teacherId,
      Number(class_id),
      Number(subject_id)
    );

    if (!assigned) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this class and subject"
      });
    }

    const [enrolled] = await db.execute(
      `SELECT s.student_id
       FROM enrollments e
       INNER JOIN students s ON s.student_id = e.student_id
       INNER JOIN users u ON u.user_id = s.user_id
       WHERE e.class_id = ?
         AND e.subject_id = ?
         AND u.is_active = 1`,
      [Number(class_id), Number(subject_id)]
    );

    const enrolledIds = new Set(
      enrolled.map((student) => Number(student.student_id))
    );

    const submittedIds = new Set(
      records.map((record) => Number(record.student_id))
    );

    if (
      submittedIds.size !== enrolledIds.size ||
      [...submittedIds].some((id) => !enrolledIds.has(id))
    ) {
      return res.status(400).json({
        success: false,
        message: "Submit attendance exactly once for every active student enrolled in this class and subject"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO attendance_sessions
       (class_id, subject_id, teacher_id, session_date, period_label)
       VALUES (?, ?, ?, ?, ?)`,
      [
        Number(class_id),
        Number(subject_id),
        teacherId,
        session_date,
        period_label.trim()
      ]
    );

    await saveRecords(connection, result.insertId, records);
    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Attendance saved successfully",
      session_id: result.insertId,
      total_students: records.length
    });
  } catch (error) {
    if (connection) await connection.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Attendance for this class, subject, date and period already exists"
      });
    }

    console.error("Create attendance session error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to save attendance"
    });
  } finally {
    if (connection) connection.release();
  }
};

// UPDATE EXISTING ATTENDANCE SESSION
exports.updateAttendanceSession = async (req, res) => {
  const teacherId = await getTeacherId(req.user.user_id).catch(() => null);
  const sessionId = Number(req.params.sessionId);
  const { records } = req.body;

  if (!teacherId) {
    return res.status(404).json({
      success: false,
      message: "Teacher profile not found"
    });
  }

  if (!validId(sessionId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid session ID"
    });
  }

  const recordsError = validateRecords(records);

  if (recordsError) {
    return res.status(400).json({
      success: false,
      message: recordsError
    });
  }

  let connection;

  try {
    const [sessions] = await db.execute(
      `SELECT session_id, class_id, subject_id, teacher_id
       FROM attendance_sessions
       WHERE session_id = ?`,
      [sessionId]
    );

    if (!sessions.length) {
      return res.status(404).json({
        success: false,
        message: "Attendance session not found"
      });
    }

    const session = sessions[0];

    if (Number(session.teacher_id) !== Number(teacherId)) {
      return res.status(403).json({
        success: false,
        message: "You cannot edit another teacher's attendance session"
      });
    }

    const [enrolled] = await db.execute(
      `SELECT s.student_id
       FROM enrollments e
       INNER JOIN students s ON s.student_id = e.student_id
       INNER JOIN users u ON u.user_id = s.user_id
       WHERE e.class_id = ?
         AND e.subject_id = ?
         AND u.is_active = 1`,
      [session.class_id, session.subject_id]
    );

    const enrolledIds = new Set(
      enrolled.map((student) => Number(student.student_id))
    );

    const submittedIds = new Set(
      records.map((record) => Number(record.student_id))
    );

    if (
      submittedIds.size !== enrolledIds.size ||
      [...submittedIds].some((id) => !enrolledIds.has(id))
    ) {
      return res.status(400).json({
        success: false,
        message: "Submit attendance exactly once for every active student enrolled in this class and subject"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    await saveRecords(connection, sessionId, records);
    await connection.commit();

    res.json({
      success: true,
      message: "Attendance updated successfully",
      session_id: sessionId,
      total_students: records.length
    });
  } catch (error) {
    if (connection) await connection.rollback();

    console.error("Update attendance session error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to update attendance"
    });
  } finally {
    if (connection) connection.release();
  }
};

// GET TEACHER ATTENDANCE HISTORY
exports.getTeacherAttendanceHistory = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req.user.user_id);

    if (!teacherId) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found"
      });
    }

    const [sessions] = await db.execute(
      `SELECT
        a.session_id,
        a.class_id,
        a.subject_id,
        a.session_date,
        a.period_label,
        c.class_name,
        c.section,
        s.subject_name,
        s.subject_code,
        COUNT(ar.record_id) AS total_students,
        SUM(ar.status = 'present') AS present_count,
        SUM(ar.status = 'absent') AS absent_count
       FROM attendance_sessions a
       INNER JOIN classes c ON c.class_id = a.class_id
       INNER JOIN subjects s ON s.subject_id = a.subject_id
       LEFT JOIN attendance_records ar ON ar.session_id = a.session_id
       WHERE a.teacher_id = ?
       GROUP BY
        a.session_id,
        a.class_id,
        a.subject_id,
        a.session_date,
        a.period_label,
        c.class_name,
        c.section,
        s.subject_name,
        s.subject_code
       ORDER BY a.session_date DESC, a.session_id DESC`,
      [teacherId]
    );

    res.json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    console.error("Get teacher attendance history error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch attendance history"
    });
  }
};
// ============================================
// ADMIN ATTENDANCE MANAGEMENT
// ============================================

// GET ALL ATTENDANCE RECORDS
exports.getAdminAttendanceRecords = async (req, res) => {
  try {
    const {
      class_id,
      subject_id,
      teacher_id,
      start_date,
      end_date,
      status,
      search
    } = req.query;

    const conditions = [];
    const params = [];

    if (class_id) {
      conditions.push("a.class_id = ?");
      params.push(Number(class_id));
    }

    if (subject_id) {
      conditions.push("a.subject_id = ?");
      params.push(Number(subject_id));
    }

    if (teacher_id) {
      conditions.push("a.teacher_id = ?");
      params.push(Number(teacher_id));
    }

    if (start_date) {
      conditions.push("a.session_date >= ?");
      params.push(start_date);
    }

    if (end_date) {
      conditions.push("a.session_date <= ?");
      params.push(end_date);
    }

    if (status) {
      conditions.push("ar.status = ?");
      params.push(status);
    }

    if (search && search.trim()) {
      conditions.push(
        "(student_user.name LIKE ? OR s.uid LIKE ? OR student_user.email LIKE ?)"
      );

      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [records] = await db.execute(
      `SELECT
        ar.record_id,
        ar.session_id,
        ar.student_id,
        ar.status,
        ar.marked_at,
        a.class_id,
        a.subject_id,
        a.teacher_id,
        a.session_date,
        a.period_label,
        c.class_name,
        c.section,
        sub.subject_name,
        sub.subject_code,
        t.employee_code,
        teacher_user.name AS teacher_name,
        s.uid,
        student_user.name AS student_name,
        student_user.email AS student_email
       FROM attendance_records ar
       INNER JOIN attendance_sessions a
         ON a.session_id = ar.session_id
       INNER JOIN students s
         ON s.student_id = ar.student_id
       INNER JOIN users student_user
         ON student_user.user_id = s.user_id
       INNER JOIN classes c
         ON c.class_id = a.class_id
       INNER JOIN subjects sub
         ON sub.subject_id = a.subject_id
       INNER JOIN teachers t
         ON t.teacher_id = a.teacher_id
       INNER JOIN users teacher_user
         ON teacher_user.user_id = t.user_id
       ${whereClause}
       ORDER BY a.session_date DESC,
                a.session_id DESC,
                student_user.name`,
      params
    );

    res.json({
      success: true,
      count: records.length,
      records
    });

  } catch (error) {
    console.error("Admin attendance fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch attendance records"
    });
  }
};


// UPDATE ONE ATTENDANCE RECORD
exports.updateAdminAttendanceRecord = async (req, res) => {
  const recordId = Number(req.params.recordId);
  const { status } = req.body;

  if (
    !Number.isInteger(recordId) ||
    recordId <= 0 ||
    !["present", "absent"].includes(status)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid record ID or attendance status"
    });
  }

  try {
    const [result] = await db.execute(
      `UPDATE attendance_records
       SET status = ?, marked_at = CURRENT_TIMESTAMP
       WHERE record_id = ?`,
      [status, recordId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    const auditLogger = require("../utils/auditLogger");

    await auditLogger(req, "ADMIN_ATTENDANCE_RECORD_UPDATED", {
      record_id: recordId,
      new_status: status
    });

    res.json({
      success: true,
      message: "Attendance updated successfully"
    });

  } catch (error) {
    console.error("Admin attendance update error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update attendance"
    });
  }
};


// DELETE ONE ATTENDANCE RECORD
exports.deleteAdminAttendanceRecord = async (req, res) => {
  const recordId = Number(req.params.recordId);

  if (!Number.isInteger(recordId) || recordId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid attendance record ID"
    });
  }

  try {
    const [rows] = await db.execute(
      `SELECT record_id, session_id, student_id, status
       FROM attendance_records
       WHERE record_id = ?`,
      [recordId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    await db.execute(
      `DELETE FROM attendance_records WHERE record_id = ?`,
      [recordId]
    );

    const auditLogger = require("../utils/auditLogger");

    await auditLogger(req, "ADMIN_ATTENDANCE_RECORD_DELETED", rows[0]);

    res.json({
      success: true,
      message: "Attendance record deleted successfully"
    });

  } catch (error) {
    console.error("Admin attendance delete error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete attendance record"
    });
  }
};


// DELETE COMPLETE ATTENDANCE SESSION
exports.deleteAdminAttendanceSession = async (req, res) => {
  const sessionId = Number(req.params.sessionId);

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid session ID"
    });
  }

  let connection;

  try {
    connection = await db.getConnection();

    await connection.beginTransaction();

    const [sessions] = await connection.execute(
      `SELECT *
       FROM attendance_sessions
       WHERE session_id = ?`,
      [sessionId]
    );

    if (!sessions.length) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Attendance session not found"
      });
    }

    const [deleted] = await connection.execute(
      `DELETE FROM attendance_records
       WHERE session_id = ?`,
      [sessionId]
    );

    await connection.execute(
      `DELETE FROM attendance_sessions
       WHERE session_id = ?`,
      [sessionId]
    );

    await connection.commit();

    const auditLogger = require("../utils/auditLogger");

    await auditLogger(req, "ADMIN_ATTENDANCE_SESSION_DELETED", {
      ...sessions[0],
      deleted_records: deleted.affectedRows
    });

    res.json({
      success: true,
      message: "Attendance session deleted successfully",
      deleted_records: deleted.affectedRows
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Admin session delete error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete attendance session"
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};
