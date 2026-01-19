const Product = require("../models/Product");
const { deleteImage } = require("../middlewares/uploadMiddleware");

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    let productsQuery = Product.find(query);

    // Sorting
    if (sort === "price-asc") {
      productsQuery = productsQuery.sort({ price: 1 });
    } else if (sort === "price-desc") {
      productsQuery = productsQuery.sort({ price: -1 });
    } else if (sort === "newest") {
      productsQuery = productsQuery.sort({ createdAt: -1 });
    } else {
      productsQuery = productsQuery.sort({ createdAt: -1 });
    }

    const products = await productsQuery;

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching products",
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get Product Error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while fetching product",
    });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      image: req.file ? req.file.path : req.body.image,
      cloudinaryId: req.file ? req.file.filename : "",
    };

    // Parse tags if it's a string
    if (typeof productData.tags === "string") {
      productData.tags = productData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    // Parse specifications if it's a string (JSON)
    if (typeof productData.specifications === "string") {
      try {
        productData.specifications = JSON.parse(productData.specifications);
      } catch (e) {
        productData.specifications = [];
      }
    }

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);

    // Delete uploaded image if product creation fails
    if (req.file) {
      await deleteImage(req.file.filename);
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while creating product",
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      // Delete uploaded image if product not found
      if (req.file) {
        await deleteImage(req.file.filename);
      }
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const updateData = { ...req.body };

    // Handle new image upload
    if (req.file) {
      // Delete old image from Cloudinary
      if (product.cloudinaryId) {
        await deleteImage(product.cloudinaryId);
      }
      updateData.image = req.file.path;
      updateData.cloudinaryId = req.file.filename;
    }

    // Parse tags if it's a string
    if (typeof updateData.tags === "string") {
      updateData.tags = updateData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    // Parse specifications if it's a string (JSON)
    if (typeof updateData.specifications === "string") {
      try {
        updateData.specifications = JSON.parse(updateData.specifications);
      } catch (e) {
        updateData.specifications = [];
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Update Product Error:", error);

    // Delete uploaded image if update fails
    if (req.file) {
      await deleteImage(req.file.filename);
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating product",
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete image from Cloudinary
    if (product.cloudinaryId) {
      await deleteImage(product.cloudinaryId);
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);

    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while deleting product",
    });
  }
};

// @desc    Validate product IDs (check which still exist)
// @route   POST /api/products/validate
// @access  Public
exports.validateProducts = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of product IDs",
      });
    }

    // Find all products that exist with these IDs
    const existingProducts = await Product.find({
      _id: { $in: ids },
    }).select("_id name price image category stock");

    // Create a map of existing IDs
    const existingIds = existingProducts.map((p) => p._id.toString());

    // Identify which IDs no longer exist
    const deletedIds = ids.filter((id) => !existingIds.includes(id));

    res.status(200).json({
      success: true,
      data: {
        existingProducts,
        existingIds,
        deletedIds,
      },
    });
  } catch (error) {
    console.error("Validate Products Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while validating products",
    });
  }
};

// @desc    Get all unique categories with product count
// @route   GET /api/products/categories/list
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    // Get all unique categories with product count
    const categories = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          image: { $first: "$image" }, // Take first product image as category image
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          count: 1,
          image: 1,
        },
      },
      {
        $sort: { name: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching categories",
    });
  }
};
