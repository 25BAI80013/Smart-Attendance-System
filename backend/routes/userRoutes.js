
const express = require("express");
const router = express.Router();

const {
    getUsers,
    updateUserStatus,
    unlockUser,
    resetUserPassword
} = require("../controllers/userController");

const {
    authenticate,
    authorize
} = require("../middleware/authMiddleware");

router.use(authenticate, authorize("admin"));

router.get("/", getUsers);
router.patch("/:id/status", updateUserStatus);
router.patch("/:id/unlock", unlockUser);
router.patch("/:id/password", resetUserPassword);

module.exports = router;
