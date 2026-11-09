
const express = require("express");
const router = express.Router();

const {
    getClasses,
    addClass,
    updateClass,
    deleteClass
} = require("../controllers/classController");

const {
    authenticate,
    authorize
} = require("../middleware/authMiddleware");

router.use(authenticate, authorize("admin"));

router.get("/", getClasses);
router.post("/", addClass);
router.put("/:id", updateClass);
router.delete("/:id", deleteClass);

module.exports = router;
