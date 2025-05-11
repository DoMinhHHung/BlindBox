const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { upload } = require("../middleware/upload");

router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProductById);
router.get("/slug/:slug", productController.getProductBySlug);
router.post("/", upload.array("images", 10), productController.createProduct);
router.put("/:id", upload.array("images", 10), productController.updateProduct);
router.delete("/:id", productController.deleteProduct);
router.post(
  "/upload-images",
  upload.array("images", 10),
  productController.uploadProductImages
);
router.delete("/:id/images/:imageUrl", productController.deleteProductImage);

module.exports = router;
