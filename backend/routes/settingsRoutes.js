const express = require("express");
const router = express.Router();

const {
  getSettings,
  updateSettings
} = require("../controllers/settingsController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

router.use(authenticate, authorize("admin"));

router.get("/", getSettings);

router.put("/", updateSettings);

module.exports = router;