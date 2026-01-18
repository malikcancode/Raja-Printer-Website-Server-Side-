const mongoose = require("mongoose");

// Shipping rules schema for local and international shipping
const shippingRulesSchema = new mongoose.Schema(
  {
    basePrice: {
      type: Number,
      default: 0,
      min: [0, "Base shipping price cannot be negative"],
    },
    perKgRate: {
      type: Number,
      default: 0,
      min: [0, "Per kg rate cannot be negative"],
    },
  },
  { _id: false },
);

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
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    // Specifications as array of key-value pairs
    specifications: {
      type: [
        {
          key: { type: String, trim: true },
          value: { type: String, trim: true },
        },
      ],
      default: [],
    },
    // Weight in kilograms for shipping calculation
    weight: {
      type: Number,
      default: 1,
      min: [0.1, "Weight must be at least 0.1 kg"],
    },
    // Shipping rules for this product
    shippingRules: {
      local: {
        type: shippingRulesSchema,
        default: () => ({ basePrice: 5, perKgRate: 2 }),
      },
      international: {
        type: shippingRulesSchema,
        default: () => ({ basePrice: 15, perKgRate: 5 }),
      },
    },
    // Local country code for determining local vs international shipping
    localCountry: {
      type: String,
      default: "US",
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index for search optimization
productSchema.index({ name: "text", category: "text", tags: "text" });

module.exports = mongoose.model("Product", productSchema);
