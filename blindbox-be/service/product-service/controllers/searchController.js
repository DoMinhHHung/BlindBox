const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const mongoose = require('mongoose');

// API tìm kiếm nâng cao
exports.advancedSearch = async (req, res) => {
  try {
    const {
      query,
      categories,
      priceMin,
      priceMax,
      productTypes,
      brands,
      ratings,
      inStock,
      sort = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    const filter = {};
    
    // Tìm kiếm theo từ khóa
    if (query) {
      filter.$text = { $search: query };
    }
    
    // Lọc theo nhiều danh mục
    if (categories) {
      const categoryIds = categories.split(',');
      
      const allCategories = await Category.find({
        $or: [
          { _id: { $in: categoryIds } },
          { 'ancestors._id': { $in: categoryIds } }
        ]
      });
      
      const allCategoryIds = allCategories.map(cat => cat._id);
      filter.category = { $in: allCategoryIds };
    }
    
    // Lọc theo khoảng giá
    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }
    
    // Lọc theo nhiều loại sản phẩm
    if (productTypes) {
      filter.productType = { $in: productTypes.split(',') };
    }
    
    // Lọc theo thương hiệu
    if (brands) {
      filter.brand = { $in: brands.split(',') };
    }
    
    // Lọc theo đánh giá
    if (ratings) {
      const ratingValues = ratings.split(',').map(Number);
      filter.avgRating = { $gte: Math.min(...ratingValues) };
    }
    
    // Lọc sản phẩm còn hàng
    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }
    
    // Xác định cách sắp xếp
    let sortOption = {};
    if (sort === 'price') {
      sortOption.price = order === 'asc' ? 1 : -1;
    } else if (sort === 'popularity') {
      sortOption.avgRating = -1;
    } else if (sort === 'newest') {
      sortOption.createdAt = -1;
    } else {
      sortOption[sort] = order === 'asc' ? 1 : -1;
    }
    
    // Thực hiện truy vấn với phân trang
    const products = await Product.find(filter)
      .select('name slug price comparePrice thumbnail productType stock category brand avgRating numReviews isFeatured')
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    // Đếm tổng số kết quả
    const total = await Product.countDocuments(filter);
    
    // Lấy các bộ lọc có sẵn
    const availableBrands = await Product.distinct('brand', filter);
    const availableProductTypes = await Product.distinct('productType', filter);
    
    // Phạm vi giá
    const priceRange = await Product.aggregate([
      { $match: filter },
      { 
        $group: {
          _id: null,
          min: { $min: '$price' },
          max: { $max: '$price' }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      filters: {
        brands: availableBrands,
        productTypes: availableProductTypes,
        priceRange: priceRange.length > 0 ? priceRange[0] : { min: 0, max: 0 }
      },
      products
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Tìm kiếm đề xuất (autocomplete)
exports.searchSuggestions = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(200).json({
        success: true,
        suggestions: []
      });
    }
    
    // Tìm kiếm từ khóa trong tên sản phẩm
    const productSuggestions = await Product.find({
      name: { $regex: query, $options: 'i' }
    })
    .select('name slug thumbnail price productType')
    .limit(Number(limit));
    
    // Tìm kiếm từ khóa trong danh mục
    const categorySuggestions = await Category.find({
      name: { $regex: query, $options: 'i' }
    })
    .select('name slug')
    .limit(5);
    
    res.status(200).json({
      success: true,
      suggestions: {
        products: productSuggestions,
        categories: categorySuggestions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Lấy các sản phẩm tương tự
exports.getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 10 } = req.query;
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Tìm sản phẩm có cùng danh mục hoặc loại sản phẩm
    const similarProducts = await Product.find({
      _id: { $ne: productId },
      $or: [
        { category: product.category },
        { productType: product.productType }
      ],
      isActive: true
    })
    .select('name slug price thumbnail productType avgRating')
    .limit(Number(limit));
    
    res.status(200).json({
      success: true,
      count: similarProducts.length,
      products: similarProducts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
