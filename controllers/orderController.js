const Order = require("../models/Order");
const Product = require("../models/Product");
const {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendAdminNewOrderNotification,
} = require("../config/email");
const { createNotification } = require("./notificationController");

/**
 * Calculate shipping cost for a single product based on destination
 * @param {Object} product - Product document from database
 * @param {Number} quantity - Quantity of items
 * @param {String} destinationCountry - Destination country code (e.g., "US")
 * @returns {Number} - Calculated shipping cost
 */
const calculateProductShipping = (product, quantity, destinationCountry) => {
  const totalWeight = product.weight * quantity;
  const isLocal =
    destinationCountry.toUpperCase() === product.localCountry.toUpperCase();

  const shippingRule = isLocal
    ? product.shippingRules.local
    : product.shippingRules.international;

  // Formula: basePrice + (weight * quantity * perKgRate)
  const shippingCost =
    shippingRule.basePrice + totalWeight * shippingRule.perKgRate;

  return Math.round(shippingCost * 100) / 100; // Round to 2 decimal places
};

// @desc    Calculate shipping cost
// @route   POST /api/orders/calculate-shipping
// @access  Public
exports.calculateShipping = async (req, res) => {
  try {
    const { items, destinationCountry } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide cart items",
      });
    }

    if (!destinationCountry) {
      return res.status(400).json({
        success: false,
        message: "Please provide destination country",
      });
    }

    let itemsPrice = 0;
    let totalShippingCost = 0;
    const calculatedItems = [];

    // Process each item
    for (const item of items) {
      // Validate MongoDB ObjectId format
      if (!item.productId || !item.productId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID format: ${item.productId}. Please ensure you're using products from the database.`,
        });
      }

      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
      }

      const itemPrice = product.price * item.quantity;
      const shippingCost = calculateProductShipping(
        product,
        item.quantity,
        destinationCountry,
      );

      itemsPrice += itemPrice;
      totalShippingCost += shippingCost;

      calculatedItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        weight: product.weight,
        image: product.image,
        itemTotal: itemPrice,
        shippingCost: shippingCost,
      });
    }

    const totalPrice = itemsPrice + totalShippingCost;

    res.status(200).json({
      success: true,
      data: {
        items: calculatedItems,
        itemsPrice: Math.round(itemsPrice * 100) / 100,
        shippingPrice: Math.round(totalShippingCost * 100) / 100,
        taxPrice: 0, // Can be implemented later
        totalPrice: Math.round(totalPrice * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Calculate Shipping Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while calculating shipping",
    });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
exports.createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      shippingDetails,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      orderNotes,
      itemsPrice: providedItemsPrice,
      shippingPrice: providedShippingPrice,
      totalPrice: providedTotalPrice,
    } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide order items",
      });
    }

    if (!shippingAddress || !shippingAddress.country) {
      return res.status(400).json({
        success: false,
        message: "Please provide shipping address with country",
      });
    }

    if (!customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: "Please provide customer name and email",
      });
    }

    // Verify shipping details are provided (from shipping zone calculation)
    if (!shippingDetails || !shippingDetails.zoneId) {
      return res.status(400).json({
        success: false,
        message: "Please calculate shipping before placing order",
      });
    }

    // Calculate items price to verify (prevent price manipulation)
    let calculatedItemsPrice = 0;
    const orderItems = [];

    for (const item of items) {
      // Validate MongoDB ObjectId format
      if (!item.productId || !item.productId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID format: ${item.productId}. Please ensure you're using products from the database.`,
        });
      }

      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
      }

      const itemPrice = product.price * item.quantity;
      calculatedItemsPrice += itemPrice;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        weight: product.weight,
        image: product.image,
        shippingCost: 0, // Individual shipping cost not applicable with zone-based shipping
      });

      // Reduce stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Verify items price matches (allow small floating point differences)
    if (Math.abs(calculatedItemsPrice - providedItemsPrice) > 1) {
      return res.status(400).json({
        success: false,
        message: "Price mismatch detected. Please refresh and try again.",
      });
    }

    // Use the shipping price from shipping zone calculation
    const totalShippingCost = providedShippingPrice || 0;
    const itemsPrice = calculatedItemsPrice;
    const totalPrice = itemsPrice + totalShippingCost;

    // Create order
    const order = await Order.create({
      user: req.user ? req.user.id : null, // If authenticated
      customerName,
      customerEmail,
      customerPhone: customerPhone || "",
      items: orderItems,
      shippingAddress,
      shippingDetails: shippingDetails || {},
      itemsPrice: Math.round(itemsPrice * 100) / 100,
      shippingPrice: Math.round(totalShippingCost * 100) / 100,
      taxPrice: 0,
      totalPrice: Math.round(totalPrice * 100) / 100,
      paymentMethod: paymentMethod || "card",
      orderNotes: orderNotes || "",
    });

    // Send email notifications (don't await to avoid blocking response)
    // Send order confirmation to customer
    sendOrderConfirmation(order)
      .then((result) => {
        if (result.success) {
          console.log(`Order confirmation email sent to ${customerEmail}`);
        } else {
          console.error(`Failed to send order confirmation: ${result.error}`);
        }
      })
      .catch((err) => console.error("Email error:", err));

    // Send notification to admin about new order
    sendAdminNewOrderNotification(order)
      .then((result) => {
        if (result.success) {
          console.log("Admin notified about new order");
        } else {
          console.error(`Failed to notify admin: ${result.error}`);
        }
      })
      .catch((err) => console.error("Admin email error:", err));

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating order",
    });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: orders,
    });
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching orders",
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Public (with email verification) / Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email",
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Allow access if user is admin, order owner, or provides correct email
    const isAdmin = req.user && req.user.role === "admin";
    const isOwner =
      req.user && order.user && order.user._id.equals(req.user.id);
    const emailMatch =
      req.query.email &&
      req.query.email.toLowerCase() === order.customerEmail.toLowerCase();

    if (!isAdmin && !isOwner && !emailMatch) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this order",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get Order Error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while fetching order",
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Please provide order status",
      });
    }

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Store previous status for email notification
    const previousStatus = order.status;

    order.status = status;

    if (status === "delivered") {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    await order.save();

    // Send status update email to customer (don't await to avoid blocking)
    if (previousStatus !== status) {
      sendOrderStatusUpdate(order, previousStatus)
        .then((result) => {
          if (result.success) {
            console.log(`Status update email sent to ${order.customerEmail}`);
          } else {
            console.error(`Failed to send status update: ${result.error}`);
          }
        })
        .catch((err) => console.error("Status update email error:", err));

      // Create notification if order has a user OR find user by email
      try {
        const User = require("../models/User");
        let userId = order.user;

        // If no user linked, try to find user by email
        if (!userId && order.customerEmail) {
          const user = await User.findOne({ email: order.customerEmail });
          if (user) {
            userId = user._id;
            // Also update the order to link the user for future
            order.user = userId;
            await order.save();
          }
        }

        if (userId) {
          const statusMessages = {
            pending: "Your order is pending confirmation",
            processing: "Your order is being processed",
            shipped: "Your order has been shipped",
            delivered: "Your order has been delivered",
            cancelled: "Your order has been cancelled",
          };

          await createNotification(
            userId,
            "order_status",
            "Order Status Updated",
            `Order #${order._id.toString().slice(-8).toUpperCase()}: ${statusMessages[status]}`,
            order._id,
          );
          console.log(`Notification created for user ${userId}`);
        } else {
          console.log(
            `No user found for order ${order._id}, skipping notification`,
          );
        }
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating order status",
    });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getUserOrders = async (req, res) => {
  try {
    // Find orders by user ID only (not by email)
    // This ensures users only see orders they placed while logged in
    const orders = await Order.find({
      user: req.user.id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get User Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user orders",
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete Order Error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while deleting order",
    });
  }
};
