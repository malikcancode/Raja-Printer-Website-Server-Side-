const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // Get current date info for comparisons
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total counts
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: "user" });

    // Revenue calculations
    const revenueResult = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Today's stats
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: startOfToday },
    });
    const todayRevenueResult = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday },
          status: { $ne: "cancelled" },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const todayRevenue = todayRevenueResult[0]?.total || 0;

    // This month's stats
    const monthOrders = await Order.countDocuments({
      createdAt: { $gte: startOfMonth },
    });
    const monthRevenueResult = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          status: { $ne: "cancelled" },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const monthRevenue = monthRevenueResult[0]?.total || 0;

    // Last month's revenue for comparison
    const lastMonthRevenueResult = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          status: { $ne: "cancelled" },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;

    // Calculate growth percentage
    const revenueGrowth =
      lastMonthRevenue > 0
        ? Math.round(
            ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100,
          )
        : monthRevenue > 0
          ? 100
          : 0;

    // Order status counts
    const orderStatusCounts = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const statusMap = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    orderStatusCounts.forEach((item) => {
      statusMap[item._id] = item.count;
    });

    // Low stock products (stock <= 5)
    const lowStockProducts = await Product.find({ stock: { $lte: 5 } })
      .select("name stock image category price")
      .sort({ stock: 1 })
      .limit(10);

    // Out of stock count
    const outOfStockCount = await Product.countDocuments({ stock: 0 });

    // Average order value
    const avgOrderResult = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, avg: { $avg: "$totalPrice" } } },
    ]);
    const averageOrderValue = Math.round(avgOrderResult[0]?.avg || 0);

    res.status(200).json({
      success: true,
      data: {
        totals: {
          revenue: totalRevenue,
          orders: totalOrders,
          products: totalProducts,
          users: totalUsers,
        },
        today: {
          orders: todayOrders,
          revenue: todayRevenue,
        },
        thisMonth: {
          orders: monthOrders,
          revenue: monthRevenue,
          revenueGrowth,
        },
        orderStatus: statusMap,
        inventory: {
          lowStockProducts,
          outOfStockCount,
          lowStockCount: lowStockProducts.length,
        },
        averageOrderValue,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

// @desc    Get revenue chart data (last 7 days or 12 months)
// @route   GET /api/dashboard/revenue-chart
// @access  Private/Admin
exports.getRevenueChart = async (req, res) => {
  try {
    const { period = "weekly" } = req.query;
    let data = [];

    if (period === "weekly") {
      // Last 7 days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push({
          start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          end: new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate() + 1,
          ),
          label: date.toLocaleDateString("en-US", { weekday: "short" }),
        });
      }

      for (const day of days) {
        const result = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: day.start, $lt: day.end },
              status: { $ne: "cancelled" },
            },
          },
          {
            $group: {
              _id: null,
              revenue: { $sum: "$totalPrice" },
              orders: { $sum: 1 },
            },
          },
        ]);
        data.push({
          label: day.label,
          revenue: result[0]?.revenue || 0,
          orders: result[0]?.orders || 0,
        });
      }
    } else {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

        const result = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lt: end },
              status: { $ne: "cancelled" },
            },
          },
          {
            $group: {
              _id: null,
              revenue: { $sum: "$totalPrice" },
              orders: { $sum: 1 },
            },
          },
        ]);

        data.push({
          label: date.toLocaleDateString("en-US", { month: "short" }),
          revenue: result[0]?.revenue || 0,
          orders: result[0]?.orders || 0,
        });
      }
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Revenue chart error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue chart data",
      error: error.message,
    });
  }
};

// @desc    Get top selling products
// @route   GET /api/dashboard/top-products
// @access  Private/Admin
exports.getTopProducts = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          image: { $first: "$items.image" },
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) },
    ]);

    res.status(200).json({
      success: true,
      data: topProducts,
    });
  } catch (error) {
    console.error("Top products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top products",
      error: error.message,
    });
  }
};

// @desc    Get recent orders
// @route   GET /api/dashboard/recent-orders
// @access  Private/Admin
exports.getRecentOrders = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const recentOrders = await Order.find()
      .select("customerName customerEmail totalPrice status createdAt items")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: recentOrders,
    });
  } catch (error) {
    console.error("Recent orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent orders",
      error: error.message,
    });
  }
};

// @desc    Get sales by category
// @route   GET /api/dashboard/sales-by-category
// @access  Private/Admin
exports.getSalesByCategory = async (req, res) => {
  try {
    // First get product IDs and categories
    const products = await Product.find().select("_id category");
    const productCategoryMap = {};
    products.forEach((p) => {
      productCategoryMap[p._id.toString()] = p.category;
    });

    // Aggregate sales
    const salesData = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
    ]);

    // Group by category
    const categoryStats = {};
    salesData.forEach((item) => {
      const category = productCategoryMap[item._id?.toString()] || "Unknown";
      if (!categoryStats[category]) {
        categoryStats[category] = { category, totalSold: 0, totalRevenue: 0 };
      }
      categoryStats[category].totalSold += item.totalSold;
      categoryStats[category].totalRevenue += item.totalRevenue;
    });

    const result = Object.values(categoryStats).sort(
      (a, b) => b.totalRevenue - a.totalRevenue,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Sales by category error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sales by category",
      error: error.message,
    });
  }
};
