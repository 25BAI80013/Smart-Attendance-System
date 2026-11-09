
const db = require("../config/db");

// GET STUDENT ID FROM LOGGED-IN USER
const getStudentId = async (userId) => {
  const [rows] = await db.execute(
    "SELECT student_id FROM students WHERE user_id = ?",
    [userId]
  );

  return rows.length ? rows[0].student_id : null;
};

// GET STUDENT ATTENDANCE SUMMARY
exports.getStudentAttendanceSummary = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.user_id);

    if (!studentId) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    const [subjects] = await db.execute(
      `SELECT
        s.subject_id,
        s.subject_name,
        s.subject_code,
        COUNT(ar.record_id) AS total_classes,
        SUM(ar.status = 'present') AS present_classes,
        SUM(ar.status = 'absent') AS absent_classes,
        ROUND(
          COALESCE(
            SUM(ar.status = 'present') * 100.0 /
            NULLIF(COUNT(ar.record_id), 0),
            0
          ),
          2
        ) AS attendance_percentage
      FROM enrollments e
      INNER JOIN subjects s ON s.subject_id = e.subject_id
      LEFT JOIN attendance_sessions ats
        ON ats.class_id = e.class_id
        AND ats.subject_id = e.subject_id
      LEFT JOIN attendance_records ar
        ON ar.session_id = ats.session_id
        AND ar.student_id = e.student_id
      WHERE e.student_id = ?
      GROUP BY
        s.subject_id,
        s.subject_name,
        s.subject_code
      ORDER BY s.subject_name`,
      [studentId]
    );

    const totalClasses = subjects.reduce(
      (sum, subject) => sum + Number(subject.total_classes || 0),
      0
    );

    const presentClasses = subjects.reduce(
      (sum, subject) => sum + Number(subject.present_classes || 0),
      0
    );

    const absentClasses = subjects.reduce(
      (sum, subject) => sum + Number(subject.absent_classes || 0),
      0
    );

    const overallPercentage = totalClasses
      ? Number(((presentClasses / totalClasses) * 100).toFixed(2))
      : 0;

    res.json({
      success: true,
      summary: {
        total_subjects: subjects.length,
        total_classes: totalClasses,
        present_classes: presentClasses,
        absent_classes: absentClasses,
        overall_percentage: overallPercentage,
        attendance_requirement: 75
      },
      subjects: subjects.map((subject) => ({
        ...subject,
        total_classes: Number(subject.total_classes || 0),
        present_classes: Number(subject.present_classes || 0),
        absent_classes: Number(subject.absent_classes || 0),
        attendance_percentage: Number(subject.attendance_percentage || 0)
      }))
    });
  } catch (error) {
    console.error("Student attendance summary error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch attendance summary"
    });
  }
};

// GET STUDENT ATTENDANCE HISTORY
exports.getStudentAttendanceHistory = async (req, res) => {
  try {
    const studentId = await getStudentId(req.user.user_id);

    if (!studentId) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    const [records] = await db.execute(
      `SELECT
        ar.record_id,
        ar.status,
        ar.marked_at,
        ats.session_id,
        ats.session_date,
        ats.period_label,
        s.subject_name,
        s.subject_code,
        c.class_name,
        c.section
      FROM attendance_records ar
      INNER JOIN attendance_sessions ats
        ON ats.session_id = ar.session_id
      INNER JOIN subjects s
        ON s.subject_id = ats.subject_id
      INNER JOIN classes c
        ON c.class_id = ats.class_id
      WHERE ar.student_id = ?
      ORDER BY ats.session_date DESC, ats.session_id DESC`,
      [studentId]
    );

    res.json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    console.error("Student attendance history error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch attendance history"
    });
  }
};
