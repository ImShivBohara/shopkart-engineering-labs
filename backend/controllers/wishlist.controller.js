const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(productId).select("_id");
    if (!product) return res.status(404).json({ message: "Product not found" });

    // $addToSet plus the filter makes the duplicate check atomic under concurrent requests.
    const customer = await Customer.findOneAndUpdate(
      { _id: req.user._id, wishlist: { $ne: product._id } },
      { $addToSet: { wishlist: product._id } },
      { new: true }
    );

    if (!customer) {
      const customerExists = await Customer.exists({ _id: req.user._id });
      if (!customerExists) return res.status(404).json({ message: "Customer not found" });
      return res.status(409).json({ message: "Product already in wishlist" });
    }

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      wishlist: customer.wishlist,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update the wishlist right now." });
  }
};

const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({ path: "wishlist", select: "name description price category image stock" });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      count: customer.wishlist.length,
      wishlist: customer.wishlist,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: req.user._id, wishlist: productId },
      { $pull: { wishlist: productId } },
      { new: true }
    );
    if (!customer) {
      const customerExists = await Customer.exists({ _id: req.user._id });
      if (!customerExists) return res.status(404).json({ message: "Customer not found" });
      return res.status(404).json({ message: "Product not found in wishlist" });
    }

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      wishlist: customer.wishlist,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update the wishlist right now." });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
};
