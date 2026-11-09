
const pool = require("../config/db");
const bcrypt = require("bcryptjs");

// GET all teachers
exports.getTeachers = async (req, res) => {
  try {
    const [teachers] = await pool.query(`
      SELECT
        t.teacher_id,
        t.user_id,
        t.employee_code,
        t.department_id,
        u.name,
        u.email,
        u.is_active,
        d.department_name,
        d.department_code
      FROM teachers t
      INNER JOIN users u ON t.user_id = u.user_id
      INNER JOIN departments d ON t.department_id = d.department_id
      ORDER BY t.teacher_id DESC
    `);

    res.status(200).json(teachers);
  } catch (error) {
    console.error("Get teachers error:", error);
    res.status(500).json({ message: "Failed to fetch teachers" });
  }
};

// ADD teacher
exports.addTeacher = async (req, res) => {
  const { name, email, password, employee_code, department_id } = req.body;

  if (!name || !email || !password || !employee_code || !department_id) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must contain at least 6 characters"
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existing] = await connection.query(
      `SELECT user_id FROM users WHERE email = ?`,
      [email]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: "Email already exists" });
    }

    const [existingCode] = await connection.query(
      `SELECT teacher_id FROM teachers WHERE employee_code = ?`,
      [employee_code]
    );

    if (existingCode.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: "Employee code already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult] = await connection.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, 'teacher')`,
      [name.trim(), email.trim().toLowerCase(), hashedPassword]
    );

    await connection.query(
      `INSERT INTO teachers (user_id, employee_code, department_id)
       VALUES (?, ?, ?)`,
      [userResult.insertId, employee_code.trim(), department_id]
    );

    await connection.commit();

    res.status(201).json({
      message: "Teacher added successfully"
    });
  } catch (error) {
    await connection.rollback();
    console.error("Add teacher error:", error);
    res.status(500).json({ message: "Failed to add teacher" });
  } finally {
    connection.release();
  }
};

// UPDATE teacher
exports.updateTeacher = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, employee_code, department_id } = req.body;

  if (!name || !email || !employee_code || !department_id) {
    return res.status(400).json({
      message: "Name, email, employee code and department are required"
    });
  }

  if (password && password.length < 6) {
    return res.status(400).json({
      message: "Password must contain at least 6 characters"
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [teachers] = await connection.query(
      `SELECT user_id FROM teachers WHERE teacher_id = ?`,
      [id]
    );

    if (teachers.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Teacher not found" });
    }

    const userId = teachers[0].user_id;

    const [emailCheck] = await connection.query(
      `SELECT user_id FROM users WHERE email = ? AND user_id != ?`,
      [email.trim().toLowerCase(), userId]
    );

    if (emailCheck.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: "Email already exists" });
    }

    const [codeCheck] = await connection.query(
      `SELECT teacher_id FROM teachers
       WHERE employee_code = ? AND teacher_id != ?`,
      [employee_code.trim(), id]
    );

    if (codeCheck.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: "Employee code already exists"
      });
    }

    await connection.query(
      `UPDATE users SET name = ?, email = ? WHERE user_id = ?`,
      [name.trim(), email.trim().toLowerCase(), userId]
    );

    await connection.query(
      `UPDATE teachers
       SET employee_code = ?, department_id = ?
       WHERE teacher_id = ?`,
      [employee_code.trim(), department_id, id]
    );

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      await connection.query(
        `UPDATE users SET password_hash = ? WHERE user_id = ?`,
        [hashedPassword, userId]
      );
    }

    await connection.commit();

    res.status(200).json({
      message: "Teacher updated successfully"
    });
  } catch (error) {
    await connection.rollback();
    console.error("Update teacher error:", error);
    res.status(500).json({ message: "Failed to update teacher" });
  } finally {
    connection.release();
  }
};

// DEACTIVATE teacher
exports.deleteTeacher = async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE users
       INNER JOIN teachers ON users.user_id = teachers.user_id
       SET users.is_active = 0
       WHERE teachers.teacher_id = ?`,
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.status(200).json({
      message: "Teacher account deactivated successfully"
    });
  } catch (error) {
    console.error("Deactivate teacher error:", error);
    res.status(500).json({ message: "Failed to deactivate teacher" });
  }
};
