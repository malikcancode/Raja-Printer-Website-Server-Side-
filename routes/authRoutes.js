const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updatePassword,
  updateProfile,
  updateProfileWithPicture,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
} = require("../controllers/authController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const { upload, profileUpload } = require("../middlewares/uploadMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes (require authentication)
router.get("/me", protect, getMe);
router.put("/updatepassword", protect, updatePassword);
router.put("/profile", protect, updateProfile);
router.put(
  "/updateprofile",
  protect,
  profileUpload.single("profilePicture"),
  updateProfileWithPicture,
);

// Admin only routes
router.get("/users", protect, authorize("admin"), getAllUsers);
router.put(
  "/users/:id/toggle-status",
  protect,
  authorize("admin"),
  toggleUserStatus,
);
router.delete("/users/:id", protect, authorize("admin"), deleteUser);

module.exports = router;
