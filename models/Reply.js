const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      required: [true, "Review reference is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    userName: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
    },
    comment: {
      type: String,
      required: [true, "Reply comment is required"],
      trim: true,
      minlength: [1, "Reply must be at least 1 character long"],
      maxlength: [500, "Reply must not exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
replySchema.index({ review: 1, createdAt: 1 });
replySchema.index({ user: 1 });

module.exports = mongoose.model("Reply", replySchema);
