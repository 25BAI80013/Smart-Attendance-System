
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const logActivity = require("../utils/auditLogger");

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

const getRequestInfo = (req) => ({
    ip_address: req.ip || req.socket?.remoteAddress || null,
    user_agent: req.get("user-agent") || null
});

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const normalizedEmail =
            typeof email === "string"
                ? email.trim().toLowerCase()
                : "";

        const requestInfo = getRequestInfo(req);

        if (!normalizedEmail || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const [users] = await db.execute(
            `SELECT
                user_id,
                name,
                email,
                password_hash,
                role,
                is_active,
                failed_login_attempts,
                locked_until,
                (locked_until IS NOT NULL AND locked_until > NOW()) AS is_locked
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [normalizedEmail]
        );

        if (users.length === 0) {
            await logActivity({
                action: "LOGIN_FAILED",
                details: `Login attempt for unknown email: ${normalizedEmail}`,
                ...requestInfo
            });

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        if (!user.is_active) {
            await logActivity({
                user_id: user.user_id,
                action: "LOGIN_BLOCKED",
                details: "Login attempt on disabled account",
                ...requestInfo
            });

            return res.status(403).json({
                success: false,
                message: "Account is disabled"
            });
        }

        // Check whether account is currently locked
        if (Number(user.is_locked) === 1) {
            await logActivity({
                user_id: user.user_id,
                action: "LOGIN_BLOCKED",
                details: "Login blocked due to too many failed attempts",
                ...requestInfo
            });

            return res.status(423).json({
                success: false,
                message: "Account temporarily locked. Try again after 15 minutes.",
                locked_until: user.locked_until
            });
        }

        // Reset expired lockout
        if (
            user.locked_until &&
            new Date(user.locked_until).getTime() <= Date.now()
        ) {
            await db.execute(
                `UPDATE users
                 SET failed_login_attempts = 0,
                     locked_until = NULL
                 WHERE user_id = ?`,
                [user.user_id]
            );

            user.failed_login_attempts = 0;
            user.locked_until = null;
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            await db.execute(
                `UPDATE users
                 SET
                    failed_login_attempts = failed_login_attempts + 1,
                    locked_until = CASE
                        WHEN failed_login_attempts + 1 >= ?
                        THEN DATE_ADD(NOW(), INTERVAL 15 MINUTE)
                        ELSE NULL
                    END
                 WHERE user_id = ?`,
                [MAX_LOGIN_ATTEMPTS, user.user_id]
            );

            const [updatedUsers] = await db.execute(
                `SELECT failed_login_attempts, locked_until
                 FROM users
                 WHERE user_id = ?`,
                [user.user_id]
            );

            const attempts = Number(
                updatedUsers[0].failed_login_attempts
            );

            const isNowLocked = attempts >= MAX_LOGIN_ATTEMPTS;

            await logActivity({
                user_id: user.user_id,
                action: isNowLocked ? "LOGIN_BLOCKED" : "LOGIN_FAILED",
                details: isNowLocked
                    ? "Account locked after 5 incorrect password attempts"
                    : `Incorrect password. Attempt ${attempts} of ${MAX_LOGIN_ATTEMPTS}`,
                ...requestInfo
            });

            return res.status(isNowLocked ? 423 : 401).json({
                success: false,
                message: isNowLocked
                    ? "Too many incorrect attempts. Account locked for 15 minutes."
                    : "Invalid email or password",
                remaining_attempts: Math.max(
                    0,
                    MAX_LOGIN_ATTEMPTS - attempts
                ),
                locked_until: updatedUsers[0].locked_until
            });
        }

        // Successful login: reset failed attempts
        await db.execute(
            `UPDATE users
             SET failed_login_attempts = 0,
                 locked_until = NULL
             WHERE user_id = ?`,
            [user.user_id]
        );

        const token = generateToken(user);

        await logActivity({
            user_id: user.user_id,
            action: "LOGIN_SUCCESS",
            details: `Successful login as ${user.role}`,
            ...requestInfo
        });

        return res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const [users] = await db.execute(
            `SELECT user_id, name, email, role, is_active
             FROM users
             WHERE user_id = ?
             LIMIT 1`,
            [req.user.user_id]
        );

        if (users.length === 0 || !users[0].is_active) {
            return res.status(401).json({
                success: false,
                message: "Account not found or disabled"
            });
        }

        const user = users[0];

        await logActivity({
            user_id: user.user_id,
            action: "PROFILE_ACCESS",
            details: "User accessed their profile",
            ...getRequestInfo(req)
        });

        return res.json({
            success: true,
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = { login, getProfile };
