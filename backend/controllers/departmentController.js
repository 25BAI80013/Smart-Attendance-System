
const db = require("../config/db");

// GET ALL DEPARTMENTS
const getDepartments = async (req, res) => {
    try {
        const [departments] = await db.execute(`
            SELECT
                d.department_id,
                d.department_name,
                d.department_code,
                d.created_at,
                COUNT(c.class_id) AS total_classes
            FROM departments d
            LEFT JOIN classes c
                ON d.department_id = c.department_id
            GROUP BY
                d.department_id,
                d.department_name,
                d.department_code,
                d.created_at
            ORDER BY d.department_name
        `);

        return res.json({
            success: true,
            count: departments.length,
            departments
        });
    } catch (error) {
        console.error("Get departments error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch departments"
        });
    }
};

// ADD DEPARTMENT
const addDepartment = async (req, res) => {
    try {
        const { department_name, department_code } = req.body;

        if (!department_name?.trim() || !department_code?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Department name and code are required"
            });
        }

        const name = department_name.trim();
        const code = department_code.trim().toUpperCase();

        const [existing] = await db.execute(
            `SELECT department_id
             FROM departments
             WHERE department_name = ? OR department_code = ?`,
            [name, code]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Department name or code already exists"
            });
        }

        const [result] = await db.execute(
            `INSERT INTO departments
             (department_name, department_code)
             VALUES (?, ?)`,
            [name, code]
        );

        return res.status(201).json({
            success: true,
            message: "Department created successfully",
            department_id: result.insertId
        });
    } catch (error) {
        console.error("Add department error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to create department"
        });
    }
};

// UPDATE DEPARTMENT
const updateDepartment = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { department_name, department_code } = req.body;

        if (
            !Number.isInteger(id) || id < 1 ||
            !department_name?.trim() ||
            !department_code?.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid department ID, name and code are required"
            });
        }

        const name = department_name.trim();
        const code = department_code.trim().toUpperCase();

        const [existing] = await db.execute(
            "SELECT department_id FROM departments WHERE department_id = ?",
            [id]
        );

        if (!existing.length) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        const [duplicate] = await db.execute(
            `SELECT department_id FROM departments
             WHERE (department_name = ? OR department_code = ?)
             AND department_id != ?`,
            [name, code, id]
        );

        if (duplicate.length) {
            return res.status(409).json({
                success: false,
                message: "Department name or code already exists"
            });
        }

        await db.execute(
            `UPDATE departments
             SET department_name = ?, department_code = ?
             WHERE department_id = ?`,
            [name, code, id]
        );

        return res.json({
            success: true,
            message: "Department updated successfully"
        });
    } catch (error) {
        console.error("Update department error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update department"
        });
    }
};

// DELETE DEPARTMENT
const deleteDepartment = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid department ID"
            });
        }

        const [departments] = await db.execute(
            "SELECT department_id FROM departments WHERE department_id = ?",
            [id]
        );

        if (!departments.length) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        const [classes] = await db.execute(
            "SELECT COUNT(*) AS total FROM classes WHERE department_id = ?",
            [id]
        );

        if (Number(classes[0].total) > 0) {
            return res.status(409).json({
                success: false,
                message: "Cannot delete department while classes are assigned to it"
            });
        }

        await db.execute(
            "DELETE FROM departments WHERE department_id = ?",
            [id]
        );

        return res.json({
            success: true,
            message: "Department deleted successfully"
        });
    } catch (error) {
        console.error("Delete department error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to delete department"
        });
    }
};

module.exports = {
    getDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment
};
