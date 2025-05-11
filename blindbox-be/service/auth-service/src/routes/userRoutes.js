const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, restrictTo } = require("../middlewares/authMiddleware");

// Routes công khai - không cần xác thực
router.post("/send-otp", userController.sendRegistrationOtp);
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);
router.post("/verify-account", userController.verifyAccount);

// Routes yêu cầu đăng nhập - tất cả user
router.use(verifyToken);
router.get("/profile", userController.getUserProfile);
router.put("/profile", userController.updateUserProfile);
router.put("/change-password", userController.changePassword);

// Routes dành cho seller và admin
router.use("/seller", verifyToken, restrictTo("seller", "admin"));
router.get("/seller/dashboard", userController.getSellerDashboard);
router.post("/seller/products", userController.createSellerProduct);

// Routes chỉ dành cho admin
router.use("/admin", verifyToken, restrictTo("admin"));
router.get("/admin/users", userController.getAllUsers);
router.get("/admin/users/:id", userController.getUserById);
router.put("/admin/users/:id", userController.updateUser);
router.delete("/admin/users/:id", userController.deleteUser);
router.put("/admin/users/:id/change-role", userController.changeUserRole);

module.exports = router;
