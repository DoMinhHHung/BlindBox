const Review = require("../models/reviewModel");
const Product = require("../models/productModel");
const { cloudinary } = require("../middleware/upload");

exports.getReviewsByProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

    const totalReviews = await Review.countDocuments({
      product: productId,
      status: "approved",
    });

    const reviews = await Review.find({
      product: productId,
      status: "approved",
    })
      .populate("user", "name avatar")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: reviews.length,
      total: totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: Number(page),
      reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const totalReviews = await Review.countDocuments(filter);

    const reviews = await Review.find(filter)
      .populate("user", "name avatar")
      .populate("product", "name slug thumbnail")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: reviews.length,
      total: totalReviews,
      totalPages: Math.ceil(totalReviews / limit),
      currentPage: Number(page),
      reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { productId, userId, rating, title, comment } = req.body;

    const existingReview = await Review.findOne({
      product: productId,
      user: userId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: "You have already reviewed this product",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    const reviewData = {
      product: productId,
      user: userId,
      rating,
      title,
      comment,
    };

    if (req.files && req.files.length > 0) {
      reviewData.images = req.files.map((file) => file.path);
    }

    const review = new Review(reviewData);
    await review.save();

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { rating, title, comment, status } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      });
    }

    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (status) review.status = status;

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.path);
      review.images = [...(review.images || []), ...newImages];
    }

    await review.save();

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      });
    }

    if (review.images && review.images.length > 0) {
      for (const imageUrl of review.images) {
        if (imageUrl.includes("cloudinary")) {
          const publicId = imageUrl.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`blindbox/${publicId}`);
        }
      }
    }

    await Review.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
