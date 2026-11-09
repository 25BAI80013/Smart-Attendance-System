
const express = require("express");
const router = express.Router();

const {
  getAssignments,
  addAssignment,
  deleteAssignment
} = require("../controllers/assignmentController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

router.use(authenticate, authorize("admin"));

router.get("/", getAssignments);
router.post("/", addAssignment);
router.delete("/:id", deleteAssignment);

module.exports = router;
