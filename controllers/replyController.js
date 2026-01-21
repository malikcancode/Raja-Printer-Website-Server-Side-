const Reply = require("../models/Reply");
const Review = require("../models/Review");

// @desc    Get replies for a review
// @route   GET /api/replies/:reviewId
// @access  Public
exports.getReviewReplies = async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Validate review exists
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const replies = await Reply.find({ review: reviewId })
      .populate("user", "name profilePicture")
      .sort({ createdAt: 1 }); // Oldest first for conversation flow

    res.status(200).json({
      success: true,
      count: replies.length,
      data: replies,
    });
  } catch (error) {
    console.error("Get Review Replies Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching replies",
    });
  }
};

// @desc    Add a reply to a review
// @route   POST /api/replies/:reviewId
// @access  Private
exports.addReply = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;

    // Validate input
    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reply comment is required",
      });
    }

    if (comment.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Reply must be at least 1 character long",
      });
    }

    if (comment.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Reply must not exceed 500 characters",
      });
    }

    // Validate review exists
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Create reply
    const reply = await Reply.create({
      review: reviewId,
      user: req.user.id,
      userName: req.user.name,
      comment: comment.trim(),
    });

    // Populate user details
    await reply.populate("user", "name profilePicture");

    res.status(201).json({
      success: true,
      message: "Reply added successfully",
      data: reply,
    });
  } catch (error) {
    console.error("Add Reply Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding reply",
    });
  }
};

// @desc    Update a reply
// @route   PUT /api/replies/reply/:replyId
// @access  Private
exports.updateReply = async (req, res) => {
  try {
    const { replyId } = req.params;
    const { comment } = req.body;

    const reply = await Reply.findById(replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    // Check if user owns this reply
    if (reply.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this reply",
      });
    }

    if (comment) {
      if (comment.trim().length < 1) {
        return res.status(400).json({
          success: false,
          message: "Reply must be at least 1 character long",
        });
      }
      if (comment.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message: "Reply must not exceed 500 characters",
        });
      }
      reply.comment = comment.trim();
    }

    await reply.save();
    await reply.populate("user", "name profilePicture");

    res.status(200).json({
      success: true,
      message: "Reply updated successfully",
      data: reply,
    });
  } catch (error) {
    console.error("Update Reply Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating reply",
    });
  }
};

// @desc    Delete a reply
// @route   DELETE /api/replies/reply/:replyId
// @access  Private
exports.deleteReply = async (req, res) => {
  try {
    const { replyId } = req.params;

    const reply = await Reply.findById(replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: "Reply not found",
      });
    }

    // Check if user owns this reply or is admin
    if (reply.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this reply",
      });
    }

    await reply.deleteOne();

    res.status(200).json({
      success: true,
      message: "Reply deleted successfully",
    });
  } catch (error) {
    console.error("Delete Reply Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting reply",
    });
  }
};
