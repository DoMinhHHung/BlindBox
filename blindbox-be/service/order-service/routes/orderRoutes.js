const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Áp dụng middleware xác thực cho tất cả các route
router.use(verifyToken);

// Routes cho người dùng
router.get('/user', orderController.getUserOrders);
router.post('/', orderController.createOrder);
router.get('/:id', orderController.getOrderById);
router.put('/:id/status', orderController.updateOrderStatus);

// Routes cho người bán
router.get('/store', checkRole(['seller', 'admin']), orderController.getStoreOrders);

// Routes cho admin
router.get('/', checkRole(['admin']), orderController.getAllOrders);
router.get('/statistics', checkRole(['admin', 'seller']), orderController.getOrderStatistics);

module.exports = router;
