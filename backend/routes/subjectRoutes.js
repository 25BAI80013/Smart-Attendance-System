
const express = require("express");
const router = express.Router();

const {
  getSubjects,
  addSubject,
  updateSubject,
  deleteSubject
} = require("../controllers/subjectController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

router.use(authenticate, authorize("admin"));

router.get("/", getSubjects);
router.post("/", addSubject);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

module.exports = router;
