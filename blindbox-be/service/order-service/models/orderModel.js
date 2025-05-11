const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    variant: {
      name: { type: String },
      color: { type: String },
      size: { type: String }
    },
    blindboxItem: {
      name: { type: String },
      rarity: { type: String },
      image: { type: String }
    }
  },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  subtotal: { type: Number, required: true }
});

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'Vietnam' },
  isDefault: { type: Boolean, default: false }
});

const orderSchema = new mongoose.Schema({
  user: {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true }
  },
  orderNumber: { type: String, unique: true, required: true },
  items: [orderItemSchema],
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  paymentMethod: {
    type: { type: String, required: true, enum: ['cod', 'card', 'banking', 'wallet'] },
    details: { type: Object }
  },
  paymentStatus: { 
    type: String, 
    required: true, 
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  status: {
    type: String,
    required: true,
    enum: ['processing', 'confirmed', 'shipping', 'delivered', 'cancelled', 'returned'],
    default: 'processing'
  },
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  notes: { type: String },
  store: {
    storeId: { type: String, required: true },
    name: { type: String, required: true }
  },
  statusHistory: [
    {
      status: { type: String },
      timestamp: { type: Date, default: Date.now },
      note: { type: String }
    }
  ],
  cancellationReason: { type: String },
  returnReason: { type: String },
  estimatedDeliveryDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Middleware để tạo orderNumber duy nhất
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    // Format: BB + năm 2 chữ số + tháng 2 chữ số + ngày 2 chữ số + số ngẫu nhiên 4 chữ số
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    this.orderNumber = `BB${year}${month}${day}${random}`;
    
    // Kiểm tra xem orderNumber đã tồn tại chưa
    const existingOrder = await mongoose.model('Order').findOne({ orderNumber: this.orderNumber });
    if (existingOrder) {
      // Nếu đã tồn tại, tạo số ngẫu nhiên mới
      return this.constructor.pre('save')(next);
    }
  }
  
  // Thêm vào lịch sử trạng thái lúc tạo đơn hàng
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: 'Order created'
    });
  }
  
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
