const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getRevenueChart,
  getTopProducts,
  getRecentOrders,
  getSalesByCategory,
} = require("../controllers/dashboardController");
const { protect, authorize } = require("../middlewares/authMiddleware");

// All routes require authentication and admin role
router.use(protect);
router.use(authorize("admin"));

router.get("/stats", getDashboardStats);
router.get("/revenue-chart", getRevenueChart);
router.get("/top-products", getTopProducts);
router.get("/recent-orders", getRecentOrders);
router.get("/sales-by-category", getSalesByCategory);

module.exports = router;
