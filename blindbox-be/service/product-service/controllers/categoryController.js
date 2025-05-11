const Category = require("../models/categoryModel");
const { cloudinary } = require("../middleware/upload");
const slugify = require("slugify");

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort("order name");

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found" });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const categoryData = req.body;

    if (!categoryData.slug && categoryData.name) {
      categoryData.slug = slugify(categoryData.name, { lower: true });
    }

    if (req.file) {
      categoryData.image = req.file.path;
    }

    const category = new Category(categoryData);
    await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const categoryData = req.body;

    if (categoryData.name && !categoryData.slug) {
      categoryData.slug = slugify(categoryData.name, { lower: true });
    }

    if (req.file) {
      const existingCategory = await Category.findById(req.params.id);

      if (existingCategory && existingCategory.image) {
        const publicId = existingCategory.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`blindbox/${publicId}`);
      }

      categoryData.image = req.file.path;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      categoryData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found" });
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, error: "Category not found" });
    }

    if (category.image) {
      const publicId = category.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`blindbox/${publicId}`);
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
