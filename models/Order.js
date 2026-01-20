const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
    weight: {
      type: Number,
      required: true,
      min: [0.1, "Weight must be at least 0.1 kg"],
    },
    image: {
      type: String,
      required: true,
    },
    // Shipping cost calculated for this specific item
    shippingCost: {
      type: Number,
      required: true,
      min: [0, "Shipping cost cannot be negative"],
    },
  },
  { _id: false },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      required: [true, "Please provide country"],
      trim: true,
      uppercase: true,
    },
    city: {
      type: String,
      required: [true, "Please provide city"],
      trim: true,
    },
    zipCode: {
      type: String,
      required: [true, "Please provide zip code"],
      trim: true,
    },
    addressLine1: {
      type: String,
      required: [true, "Please provide address"],
      trim: true,
    },
    addressLine2: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Allow guest checkout
    },
    customerName: {
      type: String,
      required: [true, "Please provide customer name"],
      trim: true,
    },
    customerEmail: {
      type: String,
      required: [true, "Please provide customer email"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    customerPhone: {
      type: String,
      trim: true,
      default: "",
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    // Shipping details
    shippingDetails: {
      zoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShippingZone",
      },
      zoneName: String,
      deliveryTime: String,
      totalWeight: Number,
      baseShippingPrice: Number,
      extraWeightCharge: Number,
      freeShippingApplied: Boolean,
      shippingMessage: String,
    },
    // Pricing breakdown
    itemsPrice: {
      type: Number,
      required: true,
      min: [0, "Items price cannot be negative"],
    },
    shippingPrice: {
      type: Number,
      required: true,
      min: [0, "Shipping price cannot be negative"],
    },
    taxPrice: {
      type: Number,
      default: 0,
      min: [0, "Tax price cannot be negative"],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price cannot be negative"],
    },
    // Order status
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    cancelReason: {
      type: String,
      default: "",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    // Payment details
    paymentMethod: {
      type: String,
      enum: ["card", "paypal", "cash", "bank_transfer"],
      default: "card",
    },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },
    // Notes
    orderNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ customerEmail: 1 });
orderSchema.index({ status: 1 });

// Virtual for order number (using _id)
orderSchema.virtual("orderNumber").get(function () {
  return `ORD-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Ensure virtuals are included in JSON
orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Order", orderSchema);
