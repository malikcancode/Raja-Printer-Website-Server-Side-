const express = require("express");
const router = express.Router();
const {
  getReviewReplies,
  addReply,
  updateReply,
  deleteReply,
} = require("../controllers/replyController");
const { protect } = require("../middlewares/authMiddleware");

// Public routes
router.get("/:reviewId", getReviewReplies);

// Protected routes
router.post("/:reviewId", protect, addReply);
router.put("/reply/:replyId", protect, updateReply);
router.delete("/reply/:replyId", protect, deleteReply);

module.exports = router;
