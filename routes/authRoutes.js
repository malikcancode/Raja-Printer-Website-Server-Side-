const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updatePassword,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes (require authentication)
router.get("/me", protect, getMe);
router.put("/updatepassword", protect, updatePassword);

module.exports = router;
