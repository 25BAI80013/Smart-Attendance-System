
const express = require("express");

const router = express.Router();

const {
    getStudents,
    addStudent,
    updateStudent,
    deleteStudent
} = require("../controllers/studentController");

const {
    authenticate,
    authorize
} = require("../middleware/authMiddleware");

// All routes require Admin authentication
router.use(authenticate, authorize("admin"));

router.get("/", getStudents);
router.post("/", addStudent);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

module.exports = router;
