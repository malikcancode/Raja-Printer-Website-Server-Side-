const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide product name"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    category: {
      type: String,
      required: [true, "Please provide product category"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Please provide product price"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"],
      default: 0,
    },
    image: {
      type: String,
      required: [true, "Please provide product image"],
    },
    cloudinaryId: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 5,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    tags: {
      type: [String],
      default: [],
    },
    isHot: {
      type: Boolean,
      default: false,
    },
    isSale: {
      type: Boolean,
      default: false,
    },
    discount: {
      type: String,
      default: "",
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Index for search optimization
productSchema.index({ name: "text", category: "text", tags: "text" });

module.exports = mongoose.model("Product", productSchema);
