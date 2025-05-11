const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'Vietnam' }
});

const bankAccountSchema = new mongoose.Schema({
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountName: { type: String, required: true },
  branch: { type: String }
});

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  logo: { type: String },
  coverImage: { type: String },
  owner: {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true }
  },
  contact: {
    email: { type: String, required: true },
    phone: { type: String, required: true },
    website: { type: String }
  },
  address: addressSchema,
  businessRegistration: {
    number: { type: String },
    image: { type: String },
    verified: { type: Boolean, default: false }
  },
  category: [{ type: String }],
  bankAccount: bankAccountSchema,
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'closed'],
    default: 'pending'
  },
  featured: { type: Boolean, default: false },
  socialMedia: {
    facebook: { type: String },
    instagram: { type: String },
    tiktok: { type: String }
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  memberSince: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Đánh index để tối ưu tìm kiếm
storeSchema.index({ name: 'text', description: 'text' });
storeSchema.index({ slug: 1 });
storeSchema.index({ status: 1 });
storeSchema.index({ 'owner.userId': 1 });

const Store = mongoose.model('Store', storeSchema);
module.exports = Store;
