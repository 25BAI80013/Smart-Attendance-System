
const db = require("../config/db");

// GET ALL ASSIGNMENTS
exports.getAssignments = async (req, res) => {
  try {
    const [assignments] = await db.execute(`
      SELECT
        ta.assignment_id,
        ta.teacher_id,
        ta.class_id,
        ta.subject_id,
        t.employee_code,
        u.name AS teacher_name,
        c.class_name,
        c.section,
        c.semester,
        c.department_id,
        s.subject_name,
        s.subject_code,
        d.department_name
      FROM teacher_assignments ta
      INNER JOIN teachers t
        ON t.teacher_id = ta.teacher_id
      INNER JOIN users u
        ON u.user_id = t.user_id
      INNER JOIN classes c
        ON c.class_id = ta.class_id
      INNER JOIN subjects s
        ON s.subject_id = ta.subject_id
      INNER JOIN departments d
        ON d.department_id = c.department_id
      ORDER BY ta.assignment_id DESC
    `);

    res.json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    console.error("Get assignments error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch teacher assignments"
    });
  }
};

// CREATE ASSIGNMENT
exports.addAssignment = async (req, res) => {
  const teacherId = Number(req.body.teacher_id);
  const classId = Number(req.body.class_id);
  const subjectId = Number(req.body.subject_id);

  if (
    !Number.isInteger(teacherId) || teacherId < 1 ||
    !Number.isInteger(classId) || classId < 1 ||
    !Number.isInteger(subjectId) || subjectId < 1
  ) {
    return res.status(400).json({
      success: false,
      message: "Select a valid teacher, class and subject"
    });
  }

  try {
    const [teachers] = await db.execute(
      `SELECT
        t.teacher_id,
        t.department_id,
        u.is_active
       FROM teachers t
       INNER JOIN users u ON u.user_id = t.user_id
       WHERE t.teacher_id = ?`,
      [teacherId]
    );

    if (!teachers.length || Number(teachers[0].is_active) !== 1) {
      return res.status(404).json({
        success: false,
        message: "Active teacher not found"
      });
    }

    const [classes] = await db.execute(
      `SELECT class_id, semester, department_id
       FROM classes
       WHERE class_id = ?`,
      [classId]
    );

    if (!classes.length) {
      return res.status(404).json({
        success: false,
        message: "Selected class not found"
      });
    }

    const [subjects] = await db.execute(
      `SELECT subject_id, semester, department_id
       FROM subjects
       WHERE subject_id = ?`,
      [subjectId]
    );

    if (!subjects.length) {
      return res.status(404).json({
        success: false,
        message: "Selected subject not found"
      });
    }

    const teacherDepartment = Number(teachers[0].department_id);
    const classDepartment = Number(classes[0].department_id);
    const subjectDepartment = Number(subjects[0].department_id);

    if (
      teacherDepartment !== classDepartment ||
      classDepartment !== subjectDepartment
    ) {
      return res.status(400).json({
        success: false,
        message: "Teacher, class and subject must belong to the same department"
      });
    }

    if (
      Number(classes[0].semester) !== Number(subjects[0].semester)
    ) {
      return res.status(400).json({
        success: false,
        message: "Subject semester must match the selected class semester"
      });
    }

    await db.execute(
      `INSERT INTO teacher_assignments
       (teacher_id, class_id, subject_id)
       VALUES (?, ?, ?)`,
      [teacherId, classId, subjectId]
    );

    res.status(201).json({
      success: true,
      message: "Teacher assigned to class and subject successfully"
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "This teacher is already assigned to this class and subject"
      });
    }

    console.error("Add assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create teacher assignment"
    });
  }
};

// DELETE ASSIGNMENT
exports.deleteAssignment = async (req, res) => {
  const assignmentId = Number(req.params.id);

  if (!Number.isInteger(assignmentId) || assignmentId < 1) {
    return res.status(400).json({
      success: false,
      message: "Invalid assignment ID"
    });
  }

  try {
    const [result] = await db.execute(
      `DELETE FROM teacher_assignments
       WHERE assignment_id = ?`,
      [assignmentId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    res.json({
      success: true,
      message: "Teacher assignment removed successfully"
    });
  } catch (error) {
    console.error("Delete assignment error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to remove assignment"
    });
  }
};
