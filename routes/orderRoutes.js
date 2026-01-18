const express = require("express");
const router = express.Router();
const {
  calculateShipping,
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  getUserOrders,
  deleteOrder,
} = require("../controllers/orderController");
const { protect, authorize } = require("../middlewares/authMiddleware");

// Public routes
router.post("/calculate-shipping", calculateShipping);
router.post("/", createOrder);
router.get("/:id", getOrder); // Can be accessed with email query param

// Protected routes
router.get("/my-orders", protect, getUserOrders);

// Admin routes
router.get("/", protect, authorize("admin"), getOrders);
router.put("/:id/status", protect, authorize("admin"), updateOrderStatus);
router.delete("/:id", protect, authorize("admin"), deleteOrder);

module.exports = router;
