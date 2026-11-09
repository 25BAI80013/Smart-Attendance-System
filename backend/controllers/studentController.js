
const db = require("../config/db");
const bcrypt = require("bcryptjs");

// ======================================
// GET ALL STUDENTS
// ======================================

const getStudents = async (req, res) => {
    try {
        const [students] = await db.execute(`
            SELECT
                s.student_id,
                s.uid,
                u.name,
                u.email,
                u.is_active,
                c.class_name,
                c.section,
                c.semester,
                d.department_name
            FROM students s
            JOIN users u ON s.user_id = u.user_id
            JOIN classes c ON s.class_id = c.class_id
            JOIN departments d ON c.department_id = d.department_id
            ORDER BY s.student_id DESC
        `);

        res.json({
            success: true,
            count: students.length,
            students
        });

    } catch (error) {
        console.error("Get students error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch students"
        });
    }
};

// ======================================
// ADD STUDENT
// ======================================

const addStudent = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const {
            name,
            email,
            password,
            uid,
            class_id
        } = req.body;

        if (!name || !email || !password || !uid || !class_id) {
            return res.status(400).json({
                success: false,
                message: "All student fields are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });
        }

        if (!Number.isInteger(Number(class_id)) || Number(class_id) < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid class ID"
            });
        }

        await connection.beginTransaction();

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUID = uid.trim();

        const [existing] = await connection.execute(
            "SELECT user_id FROM users WHERE email = ?",
            [normalizedEmail]
        );

        if (existing.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        const [existingUID] = await connection.execute(
            "SELECT student_id FROM students WHERE uid = ?",
            [normalizedUID]
        );

        if (existingUID.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Student UID already exists"
            });
        }

        const [classes] = await connection.execute(
            "SELECT class_id FROM classes WHERE class_id = ?",
            [Number(class_id)]
        );

        if (classes.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Selected class does not exist"
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const [userResult] = await connection.execute(
            `INSERT INTO users
             (name, email, password_hash, role)
             VALUES (?, ?, ?, 'student')`,
            [name.trim(), normalizedEmail, passwordHash]
        );

        await connection.execute(
            `INSERT INTO students (user_id, uid, class_id)
             VALUES (?, ?, ?)`,
            [userResult.insertId, normalizedUID, Number(class_id)]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Student added successfully"
        });

    } catch (error) {
        await connection.rollback();

        console.error("Add student error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to add student"
        });

    } finally {
        connection.release();
    }
};

// ======================================
// UPDATE STUDENT
// ======================================

const updateStudent = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { id } = req.params;
        const { name, email, uid, class_id } = req.body;

        if (!name || !email || !uid || !class_id) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        if (!Number.isInteger(Number(class_id)) || Number(class_id) < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid class ID"
            });
        }

        await connection.beginTransaction();

        const [students] = await connection.execute(
            "SELECT user_id FROM students WHERE student_id = ?",
            [id]
        );

        if (students.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const userId = students[0].user_id;
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUID = uid.trim();

        const [emailCheck] = await connection.execute(
            "SELECT user_id FROM users WHERE email = ? AND user_id != ?",
            [normalizedEmail, userId]
        );

        if (emailCheck.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Email already in use"
            });
        }

        const [uidCheck] = await connection.execute(
            "SELECT student_id FROM students WHERE uid = ? AND student_id != ?",
            [normalizedUID, id]
        );

        if (uidCheck.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "Student UID already in use"
            });
        }

        const [classes] = await connection.execute(
            "SELECT class_id FROM classes WHERE class_id = ?",
            [Number(class_id)]
        );

        if (classes.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Selected class does not exist"
            });
        }

        await connection.execute(
            "UPDATE users SET name = ?, email = ? WHERE user_id = ?",
            [name.trim(), normalizedEmail, userId]
        );

        await connection.execute(
            "UPDATE students SET uid = ?, class_id = ? WHERE student_id = ?",
            [normalizedUID, Number(class_id), id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: "Student updated successfully"
        });

    } catch (error) {
        await connection.rollback();

        console.error("Update student error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to update student"
        });

    } finally {
        connection.release();
    }
};

// ======================================
// DEACTIVATE STUDENT
// ======================================

const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.execute(
            `UPDATE users u
             JOIN students s ON u.user_id = s.user_id
             SET u.is_active = FALSE
             WHERE s.student_id = ? AND u.is_active = TRUE`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Active student not found"
            });
        }

        res.json({
            success: true,
            message: "Student deactivated successfully"
        });

    } catch (error) {
        console.error("Deactivate student error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to deactivate student"
        });
    }
};

module.exports = {
    getStudents,
    addStudent,
    updateStudent,
    deleteStudent
};
