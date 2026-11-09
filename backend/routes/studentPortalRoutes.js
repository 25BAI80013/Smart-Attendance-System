
const express = require("express");
const router = express.Router();

const {
  getStudentAttendanceSummary,
  getStudentAttendanceHistory
} = require("../controllers/studentPortalController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

router.use(authenticate, authorize("student"));

router.get("/summary", getStudentAttendanceSummary);

router.get("/history", getStudentAttendanceHistory);

module.exports = router;
