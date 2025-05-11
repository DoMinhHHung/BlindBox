const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// API tìm kiếm nâng cao công khai
router.get('/advanced', searchController.advancedSearch);

// API gợi ý tìm kiếm (autocomplete)
router.get('/suggestions', searchController.searchSuggestions);

// API lấy sản phẩm tương tự
router.get('/similar/:productId', searchController.getSimilarProducts);

module.exports = router;
