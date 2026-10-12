const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const cartItemIndex = customer.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (cartItemIndex === -1) {
      if (product.stock < 1) {
        return res.status(400).json({
          message: "Product is out of stock",
        });
      }
      customer.cart.push({ product: productId, quantity: 1 });
    } else {
      const currentQuantity = customer.cart[cartItemIndex].quantity;
      if (currentQuantity + 1 > product.stock) {
        return res.status(400).json({
          message: `Cannot exceed available stock (${product.stock})`,
        });
      }
      customer.cart[cartItemIndex].quantity += 1;
    }

    await customer.save();
    await customer.populate("cart.product");

    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart: customer.cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


const getCart = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate(
      "cart.product"
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    // Remove cart entries whose referenced product no longer exists.
    const hasInvalidItems = customer.cart.some(
      (item) => !item.product
    );

    if (hasInvalidItems) {
      customer.cart = customer.cart.filter(
        (item) => item.product
      );

      await customer.save();
      await customer.populate("cart.product");
    }

    return res.status(200).json({
      success: true,
      count: customer.cart.length,
      cart: customer.cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};


const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    if (typeof quantity !== "number" || !Number.isInteger(quantity)) {
      return res.status(400).json({
        message: "Quantity must be a valid number",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        message: "Quantity must be at least 1",
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const cartItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({
        message: "Product not found in cart",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        message: `Quantity exceeds available stock (${product.stock})`,
      });
    }

    cartItem.quantity = quantity;
    await customer.save();
    await customer.populate("cart.product");

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated successfully",
      cart: customer.cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const itemIndex = customer.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        message: "Product not found in cart",
      });
    }

    customer.cart.splice(itemIndex, 1);
    await customer.save();
    await customer.populate("cart.product");

    return res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart: customer.cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
};
