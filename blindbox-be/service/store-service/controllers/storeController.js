const Store = require('../models/storeModel');
const { cloudinary } = require('../middleware/upload');
const slugify = require('slugify');
const axios = require('axios');

// Lấy tất cả cửa hàng (public)
exports.getAllStores = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, status = 'active' } = req.query;
    
    const query = { status };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const stores = await Store.find(query)
      .sort({ featured: -1, rating: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
      
    const total = await Store.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: stores.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      stores
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy thông tin cửa hàng theo ID
exports.getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    
    res.status(200).json({
      success: true,
      store
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy thông tin cửa hàng theo slug
exports.getStoreBySlug = async (req, res) => {
  try {
    const store = await Store.findOne({ slug: req.params.slug });
    
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    
    res.status(200).json({
      success: true,
      store
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tạo cửa hàng mới
exports.createStore = async (req, res) => {
  try {
    const {
      name,
      description,
      contact,
      address,
      businessRegistration,
      category,
      bankAccount,
      socialMedia,
      operatingHours
    } = req.body;
    
    // Kiểm tra xem người dùng đã có cửa hàng chưa
    const existingStore = await Store.findOne({ 'owner.userId': req.user.id });
    if (existingStore) {
      return res.status(400).json({
        success: false,
        message: 'You already have a store'
      });
    }
    
    const slug = slugify(name, { lower: true });
    
    // Kiểm tra xem slug đã tồn tại chưa
    const slugExist = await Store.findOne({ slug });
    if (slugExist) {
      return res.status(400).json({
        success: false,
        message: 'Store name already exists'
      });
    }
    
    // Upload logo và cover image nếu có
    let logoUrl = null;
    let coverImageUrl = null;
    let businessRegistrationImageUrl = null;
    
    if (req.files) {
      if (req.files.logo) {
        logoUrl = req.files.logo[0].path;
      }
      
      if (req.files.coverImage) {
        coverImageUrl = req.files.coverImage[0].path;
      }
      
      if (req.files.businessRegistrationImage) {
        businessRegistrationImageUrl = req.files.businessRegistrationImage[0].path;
      }
    }
    
    // Tạo cửa hàng mới
    const store = new Store({
      name,
      slug,
      description,
      logo: logoUrl,
      coverImage: coverImageUrl,
      owner: {
        userId: req.user.id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email
      },
      contact,
      address,
      businessRegistration: {
        ...businessRegistration,
        image: businessRegistrationImageUrl
      },
      category,
      bankAccount,
      socialMedia,
      operatingHours
    });
    
    await store.save();
    
    // Cập nhật role của người dùng thành seller
    await axios.put(
      `${process.env.AUTH_SERVICE_URL || 'http://localhost:2000'}/api/auth/users/${req.user.id}/role`,
      { role: 'seller' },
      { headers: { Authorization: req.headers.authorization } }
    );
    
    res.status(201).json({
      success: true,
      message: 'Store created successfully and awaiting approval',
      store
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật thông tin cửa hàng
exports.updateStore = async (req, res) => {
  try {
    const storeId = req.params.id;
    const {
      name,
      description,
      contact,
      address,
      businessRegistration,
      category,
      bankAccount,
      socialMedia,
      operatingHours
    } = req.body;
    
    let store = await Store.findById(storeId);
    
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    
    // Kiểm tra quyền cập nhật cửa hàng
    if (req.user.role !== 'admin' && store.owner.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this store'
      });
    }
    
    // Xử lý slug nếu tên thay đổi
    let slug = store.slug;
    if (name && name !== store.name) {
      slug = slugify(name, { lower: true });
      
      // Kiểm tra xem slug mới có trùng không
      const slugExist = await Store.findOne({ slug, _id: { $ne: storeId } });
      if (slugExist) {
        return res.status(400).json({
          success: false,
          message: 'Store name already exists'
        });
      }
    }
    
    // Xử lý uploads (nếu có)
    let updateData = { 
      name: name || store.name,
      slug,
      description: description || store.description,
      contact: contact || store.contact,
      address: address || store.address,
      businessRegistration: businessRegistration || store.businessRegistration,
      category: category || store.category,
      bankAccount: bankAccount || store.bankAccount,
      socialMedia: socialMedia || store.socialMedia,
      operatingHours: operatingHours || store.operatingHours
    };
    
    if (req.files) {
      // Xử lý logo
      if (req.files.logo) {
        // Xóa logo cũ (nếu có)
        if (store.logo) {
          const publicId = store.logo.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`blindbox/${publicId}`);
        }
        
        updateData.logo = req.files.logo[0].path;
      }
      
      // Xử lý cover image
      if (req.files.coverImage) {
        // Xóa cover image cũ (nếu có)
        if (store.coverImage) {
          const publicId = store.coverImage.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`blindbox/${publicId}`);
        }
        
        updateData.coverImage = req.files.coverImage[0].path;
      }
      
      // Xử lý business registration image
      if (req.files.businessRegistrationImage) {
        // Xóa ảnh cũ (nếu có)
        if (store.businessRegistration && store.businessRegistration.image) {
          const publicId = store.businessRegistration.image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`blindbox/${publicId}`);
        }
        
        if (!updateData.businessRegistration) {
          updateData.businessRegistration = { ...store.businessRegistration };
        }
        
        updateData.businessRegistration.image = req.files.businessRegistrationImage[0].path;
      }
    }
    
    // Cập nhật cửa hàng
    store = await Store.findByIdAndUpdate(storeId, updateData, { new: true });
    
    res.status(200).json({
      success: true,
      message: 'Store updated successfully',
      store
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật trạng thái cửa hàng (chỉ admin)
exports.updateStoreStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'active', 'suspended', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    const store = await Store.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    
    // Nếu cửa hàng bị đóng, cập nhật role của người dùng về user
    if (status === 'closed') {
      await axios.put(
        `${process.env.AUTH_SERVICE_URL || 'http://localhost:2000'}/api/auth/users/${store.owner.userId}/role`,
        { role: 'user' },
        { headers: { Authorization: req.headers.authorization } }
      );
    }
    
    res.status(200).json({
      success: true,
      message: 'Store status updated successfully',
      store
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa cửa hàng (chỉ admin)
exports.deleteStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    
    // Xóa logo và cover image từ Cloudinary
    if (store.logo) {
      const publicId = store.logo.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`blindbox/${publicId}`);
    }
    
    if (store.coverImage) {
      const publicId = store.coverImage.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`blindbox/${publicId}`);
    }
    
    if (store.businessRegistration && store.businessRegistration.image) {
      const publicId = store.businessRegistration.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`blindbox/${publicId}`);
    }
    
    // Cập nhật role của người dùng về user
    await axios.put(
      `${process.env.AUTH_SERVICE_URL || 'http://localhost:2000'}/api/auth/users/${store.owner.userId}/role`,
      { role: 'user' },
      { headers: { Authorization: req.headers.authorization } }
    );
    
    // Xóa cửa hàng
    await Store.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy cửa hàng của người dùng đang đăng nhập
exports.getUserStore = async (req, res) => {
  try {
    const store = await Store.findOne({ 'owner.userId': req.user.id });
    
    if (!store) {
      return res.status(404).json({ success: false, message: 'You do not have a store' });
    }
    
    res.status(200).json({
      success: true,
      store
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
