
require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("../config/db");

async function createAdmin() {
    try {
        const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

        if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
            throw new Error("Admin environment variables are missing");
        }

        if (ADMIN_PASSWORD.length < 12) {
            throw new Error("Admin password must be at least 12 characters");
        }

        const email = ADMIN_EMAIL.trim().toLowerCase();

        const [existing] = await db.execute(
            "SELECT user_id FROM users WHERE email = ?",
            [email]
        );

        if (existing.length > 0) {
            console.log("Admin email already exists. No account created.");
            return;
        }

        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

        await db.execute(
            `INSERT INTO users (name, email, password_hash, role)
             VALUES (?, ?, ?, 'admin')`,
            [ADMIN_NAME, email, passwordHash]
        );

        console.log("Admin account created successfully!");

    } catch (error) {
        console.error("Admin creation failed:", error.message);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
}

createAdmin();
