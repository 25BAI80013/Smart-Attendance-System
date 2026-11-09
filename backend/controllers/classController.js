
const db = require("../config/db");

// GET ALL CLASSES
const getClasses = async (req, res) => {
    try {
        const [classes] = await db.execute(`
            SELECT
                c.class_id,
                c.class_name,
                c.section,
                c.semester,
                c.department_id,
                c.academic_year,
                d.department_name,
                d.department_code
            FROM classes c
            INNER JOIN departments d
                ON c.department_id = d.department_id
            ORDER BY c.class_name, c.section, c.semester
        `);

        return res.json({
            success: true,
            count: classes.length,
            classes
        });
    } catch (error) {
        console.error("Get classes error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch classes"
        });
    }
};

// ADD CLASS
const addClass = async (req, res) => {
    try {
        const {
            class_name,
            section,
            semester,
            department_id,
            academic_year
        } = req.body;

        const semesterNumber = Number(semester);
        const departmentId = Number(department_id);

        if (
            !class_name?.trim() ||
            !section?.trim() ||
            !Number.isInteger(semesterNumber) ||
            semesterNumber < 1 ||
            !Number.isInteger(departmentId) ||
            departmentId < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid class name, section, semester and department are required"
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

        const [result] = await db.execute(
            `INSERT INTO classes
             (class_name, section, semester, department_id, academic_year)
             VALUES (?, ?, ?, ?, ?)`,
            [
                class_name.trim(),
                section.trim(),
                semesterNumber,
                departmentId,
                academic_year?.trim() || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Class created successfully",
            class_id: result.insertId
        });
    } catch (error) {
        console.error("Add class error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to create class"
        });
    }
};

// UPDATE CLASS
const updateClass = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const {
            class_name,
            section,
            semester,
            department_id,
            academic_year
        } = req.body;

        const semesterNumber = Number(semester);
        const departmentId = Number(department_id);

        if (
            !Number.isInteger(id) || id < 1 ||
            !class_name?.trim() ||
            !section?.trim() ||
            !Number.isInteger(semesterNumber) ||
            semesterNumber < 1 ||
            !Number.isInteger(departmentId) ||
            departmentId < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid class details"
            });
        }

        const [existing] = await db.execute(
            "SELECT class_id FROM classes WHERE class_id = ?",
            [id]
        );

        if (!existing.length) {
            return res.status(404).json({
                success: false,
                message: "Class not found"
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

        await db.execute(
            `UPDATE classes
             SET class_name = ?,
                 section = ?,
                 semester = ?,
                 department_id = ?,
                 academic_year = ?
             WHERE class_id = ?`,
            [
                class_name.trim(),
                section.trim(),
                semesterNumber,
                departmentId,
                academic_year?.trim() || null,
                id
            ]
        );

        return res.json({
            success: true,
            message: "Class updated successfully"
        });
    } catch (error) {
        console.error("Update class error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update class"
        });
    }
};

// DELETE CLASS
const deleteClass = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid class ID"
            });
        }

        const [existing] = await db.execute(
            "SELECT class_id FROM classes WHERE class_id = ?",
            [id]
        );

        if (!existing.length) {
            return res.status(404).json({
                success: false,
                message: "Class not found"
            });
        }

        const [students] = await db.execute(
            "SELECT COUNT(*) AS total FROM students WHERE class_id = ?",
            [id]
        );

        if (Number(students[0].total) > 0) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete class while students are assigned to it"
            });
        }

        await db.execute(
            "DELETE FROM classes WHERE class_id = ?",
            [id]
        );

        return res.json({
            success: true,
            message: "Class deleted successfully"
        });
    } catch (error) {
        console.error("Delete class error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to delete class"
        });
    }
};

module.exports = {
    getClasses,
    addClass,
    updateClass,
    deleteClass
};
