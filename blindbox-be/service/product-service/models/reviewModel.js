const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    comment: { type: String },
    images: [String],
    isVerifiedPurchase: { type: Boolean, default: false }, // Người mua đã xác nhận
    likes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Đánh index theo sản phẩm để dễ tìm kiếm
reviewSchema.index({ product: 1, createdAt: -1 });

// Tự động cập nhật rating trung bình trong bảng Product
reviewSchema.post("save", async function () {
  try {
    const Product = mongoose.model("Product");

    // Tính rating trung bình
    const result = await mongoose.model("Review").aggregate([
      { $match: { product: this.product, status: "approved" } },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          numReviews: { $sum: 1 },
        },
      },
    ]);

    if (result.length > 0) {
      // Cập nhật rating cho sản phẩm
      await Product.findByIdAndUpdate(this.product, {
        avgRating: result[0].avgRating,
        numReviews: result[0].numReviews,
      });
    }
  } catch (error) {
    console.error("Error updating product rating:", error);
  }
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
