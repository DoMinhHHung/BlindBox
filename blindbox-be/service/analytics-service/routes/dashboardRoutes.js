const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Áp dụng middleware xác thực cho tất cả các route
router.use(verifyToken);

// Dashboard cho người dùng
router.get('/user', dashboardController.getUserDashboard);

// Dashboard cho người bán
router.get('/seller', checkRole(['seller', 'admin']), dashboardController.getSellerDashboard);

// Dashboard cho admin
router.get('/admin', checkRole(['admin']), dashboardController.getAdminDashboard);

module.exports = router;
