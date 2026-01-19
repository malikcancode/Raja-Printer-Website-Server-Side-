const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updatePassword,
  updateProfile,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");
const { upload, profileUpload } = require("../middlewares/uploadMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes (require authentication)
router.get("/me", protect, getMe);
router.put("/updatepassword", protect, updatePassword);
router.put(
  "/updateprofile",
  protect,
  profileUpload.single("profilePicture"),
  updateProfile,
);

module.exports = router;
