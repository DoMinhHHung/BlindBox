const mongoose = require("mongoose");

// Schema cho kích thước quần áo và giày dép
const sizeSchema = new mongoose.Schema({
  name: { type: String, required: true }, // S, M, L, XL hoặc 38, 39, 40, 41, 42
  quantity: { type: Number, default: 0 },
  additionalPrice: { type: Number, default: 0 },
});

// Schema cho các biến thể của sản phẩm (màu sắc, kiểu dáng...)
const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String },
  images: [String],
  price: { type: Number },
  sizes: [sizeSchema],
  sku: { type: String }, // Mã SKU cho biến thể
  stock: { type: Number, default: 0 }, // Số lượng tồn kho
});

const blindboxItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  rarity: {
    type: String,
    enum: ["common", "uncommon", "rare", "epic", "legendary"],
    default: "common",
  },
  dropRate: { type: Number, required: true },
  value: { type: Number },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    shortDescription: { type: String },
    price: { type: Number, required: true },
    comparePrice: { type: Number },
    costPrice: { type: Number },

    thumbnail: { type: String },
    images: [String],
    video: { type: String },

    // Phân loại
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    tags: [{ type: String }],
    brand: { type: String },

    // Loại sản phẩm
    productType: {
      type: String,
      enum: ["clothing", "shoes", "blindbox", "mysterybox", "second_hand"],
      required: true,
      index: true,
    },

    // Các trường theo loại sản phẩm
    // Cho quần áo
    clothing: {
      gender: { type: String, enum: ["men", "women", "unisex", "kids"] },
      material: { type: String },
      careInstructions: { type: String },
      style: { type: String },
    },

    shoes: {
      gender: { type: String, enum: ["men", "women", "unisex", "kids"] },
      material: { type: String },
      soleType: { type: String },
      closureType: { type: String },
    },

    // Cho blindbox/mysterybox
    blindbox: {
      items: [blindboxItemSchema], // Các vật phẩm có thể nhận được
      totalItems: { type: Number }, // Tổng số vật phẩm trong box
      guaranteedRarity: { type: String }, // Độ hiếm tối thiểu được đảm bảo
      isRevealed: { type: Boolean, default: false }, // Box đã mở hay chưa
      series: { type: String }, // Series/bộ sưu tập của box
      edition: { type: String }, // Phiên bản đặc biệt (nếu có)
    },

    // Cho second_hand
    secondHand: {
      condition: {
        type: String,
        enum: ["new_with_tags", "excellent", "good", "fair", "poor"],
        default: "good",
      },
      usedDuration: { type: String }, // Thời gian đã sử dụng
      flaws: { type: String }, // Mô tả khuyết điểm (nếu có)
      originalPrice: { type: Number }, // Giá gốc khi mua mới
    },

    // Biến thể của sản phẩm
    variants: [variantSchema],

    // Kho hàng
    sku: { type: String }, // Mã SKU chung
    barcode: { type: String }, // Mã vạch/barcode
    weight: { type: Number }, // Cân nặng (gram)
    dimensions: {
      length: { type: Number }, // Chiều dài (cm)
      width: { type: Number }, // Chiều rộng (cm)
      height: { type: Number }, // Chiều cao (cm)
    },
    stock: { type: Number, default: 0 }, // Tổng số lượng tồn kho
    lowStockThreshold: { type: Number, default: 5 }, // Ngưỡng cảnh báo hết hàng

    // Thông tin kinh doanh
    isFeatured: { type: Boolean, default: false }, // Sản phẩm nổi bật
    isActive: { type: Boolean, default: true }, // Đang kinh doanh
    taxable: { type: Boolean, default: true }, // Chịu thuế hay không
    taxClass: { type: String, default: "standard" }, // Loại thuế áp dụng

    // SEO
    metaTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: { type: String },

    // Thời gian
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Đánh index để tối ưu tìm kiếm
productSchema.index({
  name: "text",
  description: "text",
  shortDescription: "text",
});

// Middleware trước khi lưu
productSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Phương thức kiểm tra hàng tồn
productSchema.methods.inStock = function () {
  return this.stock > 0;
};

// Phương thức kiểm tra hàng sắp hết
productSchema.methods.lowStock = function () {
  return this.stock <= this.lowStockThreshold;
};

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
