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
