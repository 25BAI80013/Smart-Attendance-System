
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const logActivity = require("../utils/auditLogger");

// GET all users
exports.getUsers = async (req, res) => {
    try {
        const { role, search } = req.query;

        let sql = `
            SELECT
                user_id,
                name,
                email,
                role,
                is_active,
                failed_login_attempts,
                locked_until,
                created_at
            FROM users
            WHERE 1 = 1
        `;

        const params = [];

        if (role && ["admin", "teacher", "student"].includes(role)) {
            sql += " AND role = ?";
            params.push(role);
        }

        if (search) {
            sql += " AND (name LIKE ? OR email LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        sql += " ORDER BY user_id DESC";

        const [users] = await db.query(sql, params);

        res.json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users"
        });
    }
};

// ACTIVATE / DEACTIVATE user
exports.updateUserStatus = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const { is_active } = req.body;

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        if (typeof is_active !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "is_active must be true or false"
            });
        }

        if (userId === Number(req.user.user_id) && !is_active) {
            return res.status(400).json({
                success: false,
                message: "You cannot deactivate your own account"
            });
        }

        const [result] = await db.query(
            "UPDATE users SET is_active = ? WHERE user_id = ?",
            [is_active ? 1 : 0, userId]
        );

        if (result.affectedRows === 0) {
            const [existing] = await db.query(
                "SELECT user_id FROM users WHERE user_id = ?",
                [userId]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }
        }

        await logActivity({
            user_id: req.user.user_id,
            action: is_active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
            details: `Admin ${is_active ? "activated" : "deactivated"} user ID ${userId}`,
            ip_address: req.ip || null,
            user_agent: req.get("user-agent") || null
        });

        res.json({
            success: true,
            message: `User ${is_active ? "activated" : "deactivated"} successfully`
        });
    } catch (error) {
        console.error("Update user status error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update user status"
        });
    }
};

// UNLOCK user account
exports.unlockUser = async (req, res) => {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        const [result] = await db.query(
            `UPDATE users
             SET failed_login_attempts = 0,
                 locked_until = NULL
             WHERE user_id = ?`,
            [userId]
        );

        if (result.affectedRows === 0) {
            const [existing] = await db.query(
                "SELECT user_id FROM users WHERE user_id = ?",
                [userId]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }
        }

        await logActivity({
            user_id: req.user.user_id,
            action: "ACCOUNT_UNLOCKED",
            details: `Admin unlocked account for user ID ${userId}`,
            ip_address: req.ip || null,
            user_agent: req.get("user-agent") || null
        });

        res.json({
            success: true,
            message: "User account unlocked successfully"
        });
    } catch (error) {
        console.error("Unlock user error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to unlock user account"
        });
    }
};

// RESET user password
exports.resetUserPassword = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const { new_password } = req.body;

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        if (
            typeof new_password !== "string" ||
            new_password.length < 8
        ) {
            return res.status(400).json({
                success: false,
                message: "New password must contain at least 8 characters"
            });
        }

        const [users] = await db.query(
            "SELECT user_id FROM users WHERE user_id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);

        await db.query(
            `UPDATE users
             SET password_hash = ?,
                 failed_login_attempts = 0,
                 locked_until = NULL
             WHERE user_id = ?`,
            [hashedPassword, userId]
        );

        await logActivity({
            user_id: req.user.user_id,
            action: "PASSWORD_RESET",
            details: `Admin reset password for user ID ${userId}`,
            ip_address: req.ip || null,
            user_agent: req.get("user-agent") || null
        });

        res.json({
            success: true,
            message: "Password reset successfully"
        });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reset password"
        });
    }
};
