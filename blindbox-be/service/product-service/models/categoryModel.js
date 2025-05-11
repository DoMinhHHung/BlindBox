const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    image: { type: String },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    ancestors: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        name: { type: String },
        slug: { type: String },
      },
    ],
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Middleware tự động tạo ancestors trước khi lưu
categorySchema.pre("save", async function (next) {
  this.updatedAt = Date.now();

  // Nếu có danh mục cha, lấy danh sách ancestors
  if (this.parent) {
    try {
      const parent = await mongoose.model("Category").findById(this.parent);
      if (parent) {
        this.ancestors = [
          ...parent.ancestors,
          {
            _id: parent._id,
            name: parent.name,
            slug: parent.slug,
          },
        ];
      }
    } catch (error) {
      next(error);
    }
  } else {
    this.ancestors = [];
  }
  next();
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
