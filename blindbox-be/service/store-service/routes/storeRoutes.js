const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');

const storeUpload = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
  { name: 'businessRegistrationImage', maxCount: 1 }
]);

// Public routes
router.get('/', storeController.getAllStores);
router.get('/:id', storeController.getStoreById);
router.get('/slug/:slug', storeController.getStoreBySlug);

// Routes yêu cầu đăng nhập
router.use(verifyToken);

// Route cho tất cả người dùng đăng nhập
router.post('/', storeUpload, storeController.createStore);

// Route cho seller và admin
router.get('/user/my-store', storeController.getUserStore);
router.put('/:id', checkRole(['seller', 'admin']), storeUpload, storeController.updateStore);

// Routes chỉ dành cho admin
router.patch('/:id/status', checkRole(['admin']), storeController.updateStoreStatus);
router.delete('/:id', checkRole(['admin']), storeController.deleteStore);

module.exports = router;
