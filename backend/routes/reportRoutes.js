const express = require("express");
const router = express.Router();

const {
  getReportOverview
} = require("../controllers/reportController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

router.use(authenticate, authorize("admin"));

router.get("/overview", getReportOverview);

module.exports = router;