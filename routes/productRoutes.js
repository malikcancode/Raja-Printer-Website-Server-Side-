const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  validateProducts,
  getCategories,
} = require("../controllers/productController");
const { protect, authorize } = require("../middlewares/authMiddleware");
const { upload } = require("../middlewares/uploadMiddleware");

// Public routes
router.get("/", getProducts);
router.get("/categories/list", getCategories);
router.post("/validate", validateProducts);
router.get("/:id", getProduct);

// Protected routes (Admin only)
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("image"),
  createProduct,
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("image"),
  updateProduct,
);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

module.exports = router;
