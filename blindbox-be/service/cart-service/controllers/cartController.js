const Cart = require('../models/cartModel');
const axios = require('axios');

// Lấy giỏ hàng của người dùng
exports.getUserCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let cart = await Cart.findOne({ 'user.userId': userId });
    
    if (!cart) {
      // Tạo giỏ hàng mới nếu chưa có
      cart = new Cart({
        user: {
          userId,
          name: `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email
        },
        items: [],
        totalItems: 0,
        totalAmount: 0
      });
      
      await cart.save();
    }
    
    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error('Error getting user cart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm sản phẩm vào giỏ hàng
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1, variantId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }
    
    // Kiểm tra sản phẩm tồn tại
    const productResponse = await axios.get(
      `${process.env.PRODUCT_SERVICE_URL || 'http://localhost:2004'}/api/products/${productId}`
    );
    
    const product = productResponse.data.product;
    
    // Kiểm tra tồn kho
    let selectedVariant = null;
    
    if (variantId && product.variants && product.variants.length > 0) {
      selectedVariant = product.variants.find(v => v._id === variantId);
      
      if (!selectedVariant) {
        return res.status(404).json({ success: false, message: 'Variant not found' });
      }
      
      if (selectedVariant.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${selectedVariant.stock} items available for this variant`
        });
      }
    } else if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available for this product`
      });
    }
    
    // Tìm hoặc tạo giỏ hàng
    let cart = await Cart.findOne({ 'user.userId': userId });
    
    if (!cart) {
      cart = new Cart({
        user: {
          userId,
          name: `${req.user.firstName} ${req.user.lastName}`,
          email: req.user.email
        },
        items: []
      });
    }
    
    // Tính giá sản phẩm
    const price = selectedVariant ? (selectedVariant.price || product.price) : product.price;
    
    // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
    const existingItemIndex = cart.items.findIndex(item => {
      if (variantId) {
        return item.product.productId === productId && item.variant.variantId === variantId;
      }
      return item.product.productId === productId && !item.variant.variantId;
    });
    
    if (existingItemIndex !== -1) {
      // Cập nhật số lượng nếu sản phẩm đã có trong giỏ
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].subtotal = cart.items[existingItemIndex].quantity * price;
    } else {
      // Thêm sản phẩm mới vào giỏ
      const variantInfo = selectedVariant ? {
        variantId: selectedVariant._id,
        name: selectedVariant.name,
        color: selectedVariant.color,
        size: selectedVariant.size
      } : {
        variantId: null,
        name: null,
        color: null,
        size: null
      };
      
      const newItem = {
        product: {
          productId,
          name: product.name,
          price,
          comparePrice: product.comparePrice,
          thumbnail: product.thumbnail,
          productType: product.productType,
          storeId: product.storeId
        },
        variant: variantInfo,
        quantity,
        subtotal: quantity * price
      };
      
      cart.items.push(newItem);
    }
    
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Product added to cart',
      cart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, quantity } = req.body;
    
    if (!itemId || !quantity) {
      return res.status(400).json({ success: false, message: 'Item ID and quantity are required' });
    }
    
    if (quantity < 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be positive' });
    }
    
    const cart = await Cart.findOne({ 'user.userId': userId });
    
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
    
    const item = cart.items[itemIndex];
    
    // Kiểm tra tồn kho
    const productResponse = await axios.get(
      `${process.env.PRODUCT_SERVICE_URL || 'http://localhost:2004'}/api/products/${item.product.productId}`
    );
    
    const product = productResponse.data.product;
    
    if (item.variant.variantId) {
      const variant = product.variants.find(v => v._id === item.variant.variantId);
      
      if (!variant || variant.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: variant ? `Only ${variant.stock} items available` : 'Variant not found'
        });
      }
    } else if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available`
      });
    }
    
    // Cập nhật số lượng và tổng tiền của sản phẩm
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].subtotal = quantity * cart.items[itemIndex].product.price;
    
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      cart
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    
    const cart = await Cart.findOne({ 'user.userId': userId });
    
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
    
    cart.items.splice(itemIndex, 1);
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa toàn bộ giỏ hàng
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cart = await Cart.findOne({ 'user.userId': userId });
    
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    cart.items = [];
    await cart.save();
    
    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
