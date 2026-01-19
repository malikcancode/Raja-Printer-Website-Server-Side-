const express = require("express");
const router = express.Router();
const {
  subscribe,
  unsubscribe,
  getAllSubscribers,
} = require("../controllers/newsletterController");
const { protect } = require("../middlewares/authMiddleware");

// Public routes
router.post("/subscribe", subscribe);
router.post("/unsubscribe", unsubscribe);

// Admin routes (protected - requires authentication and admin role)
router.get("/subscribers", protect, getAllSubscribers);

module.exports = router;
