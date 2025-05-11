const Product = require("../models/productModel");
const { cloudinary } = require("../middleware/upload");
const mongoose = require("mongoose");
const slugify = require("slugify");

exports.getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      category,
      productType,
      search,
      priceMin,
      priceMax,
      featured,
    } = req.query;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (productType) {
      filter.productType = productType;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }

    if (featured === "true") {
      filter.isFeatured = true;
    }

    const totalProducts = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: products.length,
      total: totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: Number(page),
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category",
      "name slug"
    );

    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate(
      "category",
      "name slug"
    );

    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;

    if (!productData.slug && productData.name) {
      productData.slug = slugify(productData.name, { lower: true });
    }

    if (req.files && req.files.length > 0) {
      productData.images = req.files.map((file) => file.path);

      if (req.files[0]) {
        productData.thumbnail = req.files[0].path;
      }
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productData = req.body;

    if (productData.name && !productData.slug) {
      productData.slug = slugify(productData.name, { lower: true });
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.path);

      if (!productData.images) {
        const existingProduct = await Product.findById(req.params.id);
        productData.images = [...(existingProduct.images || []), ...newImages];
      } else if (Array.isArray(productData.images)) {
        productData.images = [...productData.images, ...newImages];
      } else {
        productData.images = newImages;
      }

      if (req.files[0] && !productData.thumbnail) {
        productData.thumbnail = req.files[0].path;
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images) {
        if (imageUrl.includes("cloudinary")) {
          const publicId = imageUrl.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`blindbox/${publicId}`);
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "No files uploaded" });
    }

    const uploadedImages = req.files.map((file) => file.path);

    res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      images: uploadedImages,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteProductImage = async (req, res) => {
  try {
    const { id, imageUrl } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    if (product.images && product.images.includes(imageUrl)) {
      if (imageUrl.includes("cloudinary")) {
        const publicId = imageUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`blindbox/${publicId}`);
      }

      product.images = product.images.filter((img) => img !== imageUrl);

      if (product.thumbnail === imageUrl) {
        product.thumbnail = product.images.length > 0 ? product.images[0] : "";
      }

      await product.save();
    }

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Thêm các API đặc biệt cho BlindBox
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true })
      .populate('category', 'name slug')
      .limit(10)
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBlindboxItems = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    if (product.productType !== 'blindbox' && product.productType !== 'mysterybox') {
      return res.status(400).json({ 
        success: false, 
        error: 'This product is not a blindbox/mysterybox' 
      });
    }
    
    res.status(200).json({
      success: true,
      items: product.blindbox?.items || [],
      totalItems: product.blindbox?.totalItems || 0,
      guaranteedRarity: product.blindbox?.guaranteedRarity
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.revealBlindbox = async (req, res) => {
  try {
    const { productId, orderId } = req.body;
    
    const product = await Product.findById(productId);
    if (!product || !product.blindbox || !product.blindbox.items || product.blindbox.items.length === 0) {
      return res.status(404).json({ success: false, error: 'Valid blindbox product not found' });
    }
    
    // Lấy các vật phẩm theo tỷ lệ rơi
    const items = product.blindbox.items;
    const totalChance = items.reduce((sum, item) => sum + item.dropRate, 0);
    
    let randomNum = Math.random() * totalChance;
    let selectedItem = null;
    
    for (const item of items) {
      randomNum -= item.dropRate;
      if (randomNum <= 0) {
        selectedItem = item;
        break;
      }
    }
    
    // Nếu không có vật phẩm nào được chọn (hiếm khi xảy ra), chọn vật phẩm cuối cùng
    if (!selectedItem) {
      selectedItem = items[items.length - 1];
    }
    
    // Lưu thông tin vào đơn hàng (điều này sẽ được kết nối với Order Service)
    // Đây chỉ là giả lập, thực tế sẽ cần gọi API của Order Service
    
    res.status(200).json({
      success: true,
      message: 'Blindbox revealed successfully',
      revealedItem: selectedItem
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProductsByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const products = await Product.find({ storeId })
      .populate('category', 'name slug')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    const total = await Product.countDocuments({ storeId });
    
    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      products
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getProductStatistics = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $group: {
          _id: '$productType',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);
    
    const totalProducts = await Product.countDocuments();
    const totalCategories = await mongoose.model('Category').countDocuments();
    
    res.status(200).json({
      success: true,
      totalProducts,
      totalCategories,
      productTypeStats: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Giảm số lượng sản phẩm trong kho sau khi đặt hàng
exports.decreaseStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        error: `Not enough stock. Available: ${product.stock}`
      });
    }
    
    product.stock -= quantity;
    
    // Cập nhật cả số lượng tồn kho trong mỗi biến thể nếu có
    if (product.variants && product.variants.length > 0 && req.body.variantId) {
      const variantIndex = product.variants.findIndex(
        v => v._id.toString() === req.body.variantId
      );
      
      if (variantIndex !== -1) {
        if (product.variants[variantIndex].stock < quantity) {
          return res.status(400).json({
            success: false,
            error: `Not enough stock for this variant. Available: ${product.variants[variantIndex].stock}`
          });
        }
        
        product.variants[variantIndex].stock -= quantity;
      }
    }
    
    await product.save();
    
    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      product: {
        id: product._id,
        name: product.name,
        stock: product.stock
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Khôi phục số lượng sản phẩm trong kho khi hủy đơn
exports.increaseStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    product.stock += quantity;
    
    // Cập nhật cả số lượng tồn kho trong mỗi biến thể nếu có
    if (product.variants && product.variants.length > 0 && req.body.variantId) {
      const variantIndex = product.variants.findIndex(
        v => v._id.toString() === req.body.variantId
      );
      
      if (variantIndex !== -1) {
        product.variants[variantIndex].stock += quantity;
      }
    }
    
    await product.save();
    
    res.status(200).json({
      success: true,
      message: 'Stock restored successfully',
      product: {
        id: product._id,
        name: product.name,
        stock: product.stock
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// API tìm kiếm sản phẩm nâng cao
exports.searchProducts = async (req, res) => {
  try {
    const { 
      query, 
      category, 
      priceMin, 
      priceMax, 
      productType, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      inStock = false
    } = req.query;
    
    const filter = {};
    
    // Tìm kiếm theo từ khóa
    if (query) {
      filter.$text = { $search: query };
    }
    
    // Lọc theo danh mục
    if (category) {
      const categoryObj = await mongoose.model('Category').findOne({ 
        $or: [
          { _id: mongoose.isValidObjectId(category) ? category : null },
          { slug: category }
        ]
      });
      
      if (categoryObj) {
        // Tìm tất cả các danh mục con
        const categories = await mongoose.model('Category').find({
          $or: [
            { _id: categoryObj._id },
            { 'ancestors._id': categoryObj._id }
          ]
        });
        
        const categoryIds = categories.map(cat => cat._id);
        filter.category = { $in: categoryIds };
      }
    }
    
    // Lọc theo khoảng giá
    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }
    
    // Lọc theo loại sản phẩm
    if (productType) {
      filter.productType = productType;
    }
    
    // Lọc sản phẩm còn hàng
    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }
    
    // Sắp xếp
    const sort = {};
    if (sortBy === 'price') {
      sort.price = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'name') {
      sort.name = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'popularity') {
      sort.viewCount = -1;
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }
    
    const products = await Product.find(filter)
      .select('name slug price comparePrice thumbnail productType stock category isFeatured')
      .populate('category', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    const total = await Product.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      products
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// API thống kê sản phẩm theo cửa hàng
exports.getStoreProductStatistics = async (req, res) => {
  try {
    const { storeId } = req.params;
    
    // Tổng số sản phẩm của cửa hàng
    const totalProducts = await Product.countDocuments({ storeId });
    
    // Số lượng sản phẩm theo loại
    const productsByType = await Product.aggregate([
      { $match: { storeId } },
      { $group: { _id: '$productType', count: { $sum: 1 } } }
    ]);
    
    // Sản phẩm sắp hết hàng
    const lowStockProducts = await Product.find({
      storeId,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      stock: { $gt: 0 }
    }).limit(10).select('name slug thumbnail stock lowStockThreshold');
    
    // Sản phẩm hết hàng
    const outOfStockCount = await Product.countDocuments({
      storeId,
      stock: 0
    });
    
    res.status(200).json({
      success: true,
      statistics: {
        totalProducts,
        productsByType,
        lowStockProducts,
        outOfStockCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
