const express = require("express");
const router = express.Router();
const {
  calculateShipping,
  getAllZones,
  getZone,
  createZone,
  updateZone,
  toggleZoneStatus,
  deleteZone,
  checkAvailability,
} = require("../controllers/shippingController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

// Public routes
router.post("/calculate", calculateShipping);
router.get("/check-availability", checkAvailability);

// Admin routes
router.get("/zones", protect, adminOnly, getAllZones);
router.get("/zones/:id", protect, adminOnly, getZone);
router.post("/zones", protect, adminOnly, createZone);
router.put("/zones/:id", protect, adminOnly, updateZone);
router.patch("/zones/:id/toggle", protect, adminOnly, toggleZoneStatus);
router.delete("/zones/:id", protect, adminOnly, deleteZone);

module.exports = router;
