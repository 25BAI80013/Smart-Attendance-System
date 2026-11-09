require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const db = require("./config/db");

// ROUTES
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const classRoutes = require("./routes/classRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const studentPortalRoutes = require("./routes/studentPortalRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const auditRoutes = require("./routes/auditRoutes");
const userRoutes = require("./routes/userRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const {
  authenticate,
  authorize
} = require("./middleware/authMiddleware");

const app = express();

// MIDDLEWARE
app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// HOME
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Attendance Management API is running!"
  });
});

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    project: "Smart Attendance Management System"
  });
});

// DATABASE CHECK
app.get("/api/db-check", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DATABASE() AS database_name"
    );

    const [tables] = await db.query("SHOW TABLES");

    res.json({
      success: true,
      message: "MySQL connected successfully!",
      database: rows[0].database_name,
      total_tables: tables.length
    });

  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed"
    });
  }
});

// AUTHENTICATION
app.use("/api/auth", authRoutes);

// ADMIN MANAGEMENT
app.use("/api/students", studentRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/users", userRoutes);

// ATTENDANCE
app.use("/api/attendance", attendanceRoutes);

// SYSTEM SETTINGS
app.use("/api/settings", settingsRoutes);

// STUDENT PORTAL
app.use("/api/student-portal", studentPortalRoutes);

// REPORTS
app.use("/api/reports", reportRoutes);

// NOTIFICATIONS
app.use("/api/notifications", notificationRoutes);

// AUDIT LOGS
app.use("/api/audit", auditRoutes);

// ADMIN TEST
app.get(
  "/api/admin/test",
  authenticate,
  authorize("admin"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Admin!",
      user: req.user
    });
  }
);

// TEACHER TEST
app.get(
  "/api/teacher/test",
  authenticate,
  authorize("teacher"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Teacher!",
      user: req.user
    });
  }
);

// STUDENT TEST
app.get(
  "/api/student/test",
  authenticate,
  authorize("student"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Student!",
      user: req.user
    });
  }
);

// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

// CENTRAL ERROR HANDLER
app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("------------------------------------");
  console.log("Smart Attendance Management System");
  console.log("------------------------------------");

  console.log(`Server running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Database: http://localhost:${PORT}/api/db-check`);

  console.log(`Students: http://localhost:${PORT}/api/students`);
  console.log(`Departments: http://localhost:${PORT}/api/departments`);
  console.log(`Classes: http://localhost:${PORT}/api/classes`);
  console.log(`Teachers: http://localhost:${PORT}/api/teachers`);
  console.log(`Subjects: http://localhost:${PORT}/api/subjects`);
  console.log(`Assignments: http://localhost:${PORT}/api/assignments`);
  console.log(`Users: http://localhost:${PORT}/api/users`);

  console.log(`Attendance: http://localhost:${PORT}/api/attendance`);
  console.log(`Settings: http://localhost:${PORT}/api/settings`);

  console.log(`Student portal: http://localhost:${PORT}/api/student-portal`);
  console.log(`Reports: http://localhost:${PORT}/api/reports`);
  console.log(`Notifications: http://localhost:${PORT}/api/notifications`);
  console.log(`Audit logs: http://localhost:${PORT}/api/audit`);

  console.log("------------------------------------");
});