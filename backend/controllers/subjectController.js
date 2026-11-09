
const db = require("../config/db");

// GET ALL SUBJECTS
exports.getSubjects = async (req, res) => {
  try {
    const [subjects] = await db.execute(`
      SELECT
        s.subject_id,
        s.subject_name,
        s.subject_code,
        s.semester,
        s.department_id,
        d.department_name,
        d.department_code
      FROM subjects s
      INNER JOIN departments d
        ON d.department_id = s.department_id
      ORDER BY d.department_name, s.semester, s.subject_name
    `);

    res.json({
      success: true,
      count: subjects.length,
      subjects
    });
  } catch (error) {
    console.error("Get subjects error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch subjects"
    });
  }
};

// ADD SUBJECT
exports.addSubject = async (req, res) => {
  try {
    const {
      subject_name,
      subject_code,
      semester,
      department_id
    } = req.body;

    const semesterNumber = Number(semester);
    const departmentId = Number(department_id);

    if (
      !subject_name?.trim() ||
      !subject_code?.trim() ||
      !Number.isInteger(semesterNumber) ||
      semesterNumber < 1 ||
      !Number.isInteger(departmentId) ||
      departmentId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid subject name, code, semester and department are required"
      });
    }

    const [departments] = await db.execute(
      "SELECT department_id FROM departments WHERE department_id = ?",
      [departmentId]
    );

    if (!departments.length) {
      return res.status(404).json({
        success: false,
        message: "Selected department does not exist"
      });
    }

    const name = subject_name.trim();
    const code = subject_code.trim().toUpperCase();

    const [duplicate] = await db.execute(
      "SELECT subject_id FROM subjects WHERE subject_code = ?",
      [code]
    );

    if (duplicate.length) {
      return res.status(409).json({
        success: false,
        message: "Subject code already exists"
      });
    }

    const [result] = await db.execute(
      `INSERT INTO subjects
       (subject_name, subject_code, semester, department_id)
       VALUES (?, ?, ?, ?)`,
      [name, code, semesterNumber, departmentId]
    );

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      subject_id: result.insertId
    });
  } catch (error) {
    console.error("Add subject error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create subject"
    });
  }
};

// UPDATE SUBJECT
exports.updateSubject = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      subject_name,
      subject_code,
      semester,
      department_id
    } = req.body;

    const semesterNumber = Number(semester);
    const departmentId = Number(department_id);

    if (
      !Number.isInteger(id) || id < 1 ||
      !subject_name?.trim() ||
      !subject_code?.trim() ||
      !Number.isInteger(semesterNumber) ||
      semesterNumber < 1 ||
      !Number.isInteger(departmentId) ||
      departmentId < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid subject details"
      });
    }

    const [existing] = await db.execute(
      "SELECT subject_id, semester, department_id FROM subjects WHERE subject_id = ?",
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    const [departments] = await db.execute(
      "SELECT department_id FROM departments WHERE department_id = ?",
      [departmentId]
    );

    if (!departments.length) {
      return res.status(404).json({
        success: false,
        message: "Selected department does not exist"
      });
    }

    const code = subject_code.trim().toUpperCase();

    const [duplicate] = await db.execute(
      `SELECT subject_id FROM subjects
       WHERE subject_code = ? AND subject_id != ?`,
      [code, id]
    );

    if (duplicate.length) {
      return res.status(409).json({
        success: false,
        message: "Subject code already exists"
      });
    }

    const academicDetailsChanged =
      Number(existing[0].semester) !== semesterNumber ||
      Number(existing[0].department_id) !== departmentId;

    if (academicDetailsChanged) {
      const [usage] = await db.execute(
        `SELECT
          (SELECT COUNT(*) FROM enrollments WHERE subject_id = ?) AS enrollments,
          (SELECT COUNT(*) FROM teacher_assignments WHERE subject_id = ?) AS assignments,
          (SELECT COUNT(*) FROM attendance_sessions WHERE subject_id = ?) AS sessions`,
        [id, id, id]
      );

      const used =
        Number(usage[0].enrollments) +
        Number(usage[0].assignments) +
        Number(usage[0].sessions);

      if (used > 0) {
        return res.status(409).json({
          success: false,
          message: "Cannot change subject department or semester because this subject is already in use. Remove its related enrollments, assignments and attendance sessions first."
        });
      }
    }

    await db.execute(
      `UPDATE subjects
       SET subject_name = ?,
           subject_code = ?,
           semester = ?,
           department_id = ?
       WHERE subject_id = ?`,
      [
        subject_name.trim(),
        code,
        semesterNumber,
        departmentId,
        id
      ]
    );

    res.json({
      success: true,
      message: "Subject updated successfully"
    });
  } catch (error) {
    console.error("Update subject error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to update subject"
    });
  }
};

// DELETE SUBJECT
exports.deleteSubject = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID"
      });
    }

    const [subjects] = await db.execute(
      "SELECT subject_id FROM subjects WHERE subject_id = ?",
      [id]
    );

    if (!subjects.length) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }

    const [usage] = await db.execute(
      `SELECT
        (SELECT COUNT(*) FROM enrollments WHERE subject_id = ?) AS enrollments,
        (SELECT COUNT(*) FROM teacher_assignments WHERE subject_id = ?) AS assignments,
        (SELECT COUNT(*) FROM attendance_sessions WHERE subject_id = ?) AS sessions`,
      [id, id, id]
    );

    const used =
      Number(usage[0].enrollments) +
      Number(usage[0].assignments) +
      Number(usage[0].sessions);

    if (used > 0) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete this subject because it has enrollments, teacher assignments or attendance history."
      });
    }

    await db.execute(
      "DELETE FROM subjects WHERE subject_id = ?",
      [id]
    );

    res.json({
      success: true,
      message: "Subject deleted successfully"
    });
  } catch (error) {
    console.error("Delete subject error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to delete subject"
    });
  }
};
