const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { upload } = require("../middleware/upload");

router.get("/", reviewController.getAllReviews);
router.get("/product/:productId", reviewController.getReviewsByProduct);
router.post("/", upload.array("images", 5), reviewController.createReview);
router.put("/:id", upload.array("images", 5), reviewController.updateReview);
router.delete("/:id", reviewController.deleteReview);

module.exports = router;
