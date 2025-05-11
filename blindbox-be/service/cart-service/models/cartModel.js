const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    comparePrice: { type: Number },
    thumbnail: { type: String },
    productType: { type: String },
    storeId: { type: String, required: true }
  },
  variant: {
    variantId: { type: String },
    name: { type: String },
    color: { type: String },
    size: { type: String }
  },
  quantity: { type: Number, required: true, default: 1 },
  subtotal: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now }
});

const cartSchema = new mongoose.Schema({
  user: {
    userId: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String }
  },
  items: [cartItemSchema],
  totalItems: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Middleware để tính toán tổng số lượng và giá trị đơn hàng
cartSchema.pre('save', function(next) {
  // Tính tổng số lượng sản phẩm
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
  
  // Tính tổng giá trị đơn hàng
  this.totalAmount = this.items.reduce((total, item) => total + item.subtotal, 0);
  
  next();
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
