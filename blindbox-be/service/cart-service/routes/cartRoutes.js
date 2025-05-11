const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middleware/authMiddleware');

// Áp dụng middleware xác thực cho tất cả các route
router.use(verifyToken);

// Lấy giỏ hàng của người dùng
router.get('/', cartController.getUserCart);

// Thêm sản phẩm vào giỏ hàng
router.post('/add', cartController.addToCart);

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/update', cartController.updateCartItem);

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/remove/:itemId', cartController.removeFromCart);

// Xóa toàn bộ giỏ hàng
router.delete('/clear', cartController.clearCart);

module.exports = router;
