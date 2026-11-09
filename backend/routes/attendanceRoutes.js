const express = require("express");
const router = express.Router();

const {
  getTeacherAssignments,
  getAttendanceStudents,
  getAttendanceSession,
  createAttendanceSession,
  updateAttendanceSession,
  getTeacherAttendanceHistory,
  getAdminAttendanceRecords,
  updateAdminAttendanceRecord,
  deleteAdminAttendanceRecord,
  deleteAdminAttendanceSession
} = require("../controllers/attendanceController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

// ADMIN ROUTES
router.get(
  "/admin/records",
  authenticate,
  authorize("admin"),
  getAdminAttendanceRecords
);

router.patch(
  "/admin/records/:recordId",
  authenticate,
  authorize("admin"),
  updateAdminAttendanceRecord
);

router.delete(
  "/admin/records/:recordId",
  authenticate,
  authorize("admin"),
  deleteAdminAttendanceRecord
);

router.delete(
  "/admin/sessions/:sessionId",
  authenticate,
  authorize("admin"),
  deleteAdminAttendanceSession
);

// TEACHER ROUTES
router.use(authenticate, authorize("teacher"));

router.get("/assignments", getTeacherAssignments);

router.get(
  "/classes/:classId/subjects/:subjectId/students",
  getAttendanceStudents
);

router.get("/sessions", getAttendanceSession);

router.post("/sessions", createAttendanceSession);

router.put("/sessions/:sessionId", updateAttendanceSession);

router.get("/history", getTeacherAttendanceHistory);

module.exports = router;