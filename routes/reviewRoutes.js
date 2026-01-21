const express = require("express");
const router = express.Router();
const {
  getProductReviews,
  submitReview,
  updateReview,
  deleteReview,
  getUserReview,
} = require("../controllers/reviewController");
const { protect } = require("../middlewares/authMiddleware");

// Public routes
router.get("/:productId", getProductReviews);

// Protected routes
router.post("/:productId", protect, submitReview);
router.get("/:productId/my-review", protect, getUserReview);
router.put("/:reviewId", protect, updateReview);
router.delete("/:reviewId", protect, deleteReview);

module.exports = router;
