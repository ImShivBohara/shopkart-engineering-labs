const mongoose = require("mongoose");
const Product = require("../models/product.model");

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    if (
      !name ||
      !description ||
      price === undefined ||
      !category ||
      !image ||
      stock === undefined
    ) {
      return res.status(400).json({
        message: "All product fields are required",
      });
    }

    if (
      typeof price !== "number" ||
      price <= 0 ||
      typeof stock !== "number" ||
      stock < 0
    ) {
      return res.status(400).json({
        message: "Price must be greater than 0 and stock cannot be negative",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      image,
      stock,
    });

    return res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.name = { $regex: safeSearch, $options: "i" };
    }

    if (category) {
      query.category = category;
    }

    const products = await Product.find(query);

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(400).json({
      message: "Invalid product ID",
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    const sorted = categories
      .filter((value) => typeof value === "string" && value.trim())
      .map((value) => value.trim())
      .sort((a, b) => a.localeCompare(b));

    return res.status(200).json({
      success: true,
      count: sorted.length,
      categories: sorted,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getCategories,
};