
const express = require("express");
const router = express.Router();

const {
    getDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment
} = require("../controllers/departmentController");

const {
    authenticate,
    authorize
} = require("../middleware/authMiddleware");

router.use(authenticate, authorize("admin"));

router.get("/", getDepartments);
router.post("/", addDepartment);
router.put("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);

module.exports = router;
