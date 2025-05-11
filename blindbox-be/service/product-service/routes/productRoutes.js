const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { upload } = require('../middleware/upload');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/:id', productController.getProductById);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/blindbox/:id/items', productController.getBlindboxItems);
router.get('/store/:storeId', productController.getProductsByStore);

// API tìm kiếm nâng cao
router.get('/search', productController.searchProducts);

// Protected routes
router.use(verifyToken);

// Seller and Admin routes
router.post('/', checkRole(['seller', 'admin']), upload.array('images', 10), productController.createProduct);
router.put('/:id', checkRole(['seller', 'admin']), upload.array('images', 10), productController.updateProduct);
router.delete('/:id', checkRole(['seller', 'admin']), productController.deleteProduct);
router.post('/upload-images', checkRole(['seller', 'admin']), upload.array('images', 10), productController.uploadProductImages);
router.delete('/:id/images/:imageUrl', checkRole(['seller', 'admin']), productController.deleteProductImage);

// Thêm API quản lý tồn kho
router.put('/:id/decrease-stock', verifyToken, checkRole(['seller', 'admin']), productController.decreaseStock);
router.put('/:id/increase-stock', verifyToken, checkRole(['seller', 'admin']), productController.increaseStock);

// BlindBox specific routes
router.post('/blindbox/reveal', checkRole(['user', 'seller', 'admin']), productController.revealBlindbox);

// API thống kê theo cửa hàng
router.get('/store/:storeId/statistics', verifyToken, checkRole(['seller', 'admin']), productController.getStoreProductStatistics);

// Admin only routes
router.get('/admin/statistics', checkRole(['admin']), productController.getProductStatistics);

module.exports = router;
