const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, restrictTo } = require("../middlewares/authMiddleware");

router.post("/send-otp", userController.sendRegistrationOtp);
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);
router.post("/verify-account", userController.verifyAccount);

module.exports = router;
