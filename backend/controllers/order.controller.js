const crypto = require("crypto");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const Order = require("../models/order.model");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

const razorpayCredentialsReady = () => Boolean(
  process.env.RAZORPAY_KEY_ID?.startsWith("rzp_test_") && process.env.RAZORPAY_KEY_SECRET
);

const getRazorpayInstance = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createPaymentOrder = async (req, res) => {
  try {
    if (!razorpayCredentialsReady()) {
      return res.status(503).json({ message: "Add valid Razorpay Test Mode credentials to backend/.env before checking out." });
    }

    const { shippingAddress } = req.body || {};
    if (!shippingAddress || typeof shippingAddress !== "object") {
      return res.status(400).json({ message: "Shipping address is required." });
    }

    const addressFields = ["fullName", "phone", "addressLine1", "city", "state", "pincode"];
    const cleanedAddress = {};
    for (const field of addressFields) {
      const value = shippingAddress[field];
      if (typeof value !== "string" || !value.trim()) {
        return res.status(400).json({ message: `Please provide ${field}.` });
      }
      cleanedAddress[field] = value.trim();
    }

    const phoneDigits = cleanedAddress.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return res.status(400).json({ message: "Please provide a valid phone number (10–15 digits)." });
    }
    cleanedAddress.phone = phoneDigits;

    if (!/^\d{6}$/.test(cleanedAddress.pincode)) {
      return res.status(400).json({ message: "Pincode must be a 6-digit number." });
    }

    const customer = await Customer.findById(req.user._id).populate("cart.product");
    if (!customer) return res.status(404).json({ message: "Customer not found." });
    if (!customer.cart?.length) return res.status(400).json({ message: "Your cart is empty." });

    const orderItems = [];
    let totalAmount = 0;
    for (const item of customer.cart) {
      const product = item.product;
      if (!product) return res.status(400).json({ message: "A product in your cart is no longer available." });
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({ message: `Invalid quantity for ${product.name}.` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `${product.name} has only ${product.stock} item(s) in stock.` });
      }
      const unitPrice = Number(product.price);
      totalAmount += unitPrice * item.quantity;
      orderItems.push({ product: product._id, name: product.name, price: unitPrice, quantity: item.quantity, image: product.image });
    }
    totalAmount = Math.round((totalAmount + Number.EPSILON) * 100) / 100;
    const amountInPaise = Math.round(totalAmount * 100);
    if (!Number.isSafeInteger(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({ message: "The order amount is invalid." });
    }

    let razorpayOrder;
    try {
      razorpayOrder = await getRazorpayInstance().orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `shopkart_${new mongoose.Types.ObjectId().toString()}`.slice(0, 40),
        notes: { customerId: customer._id.toString() },
      });
    } catch (gatewayError) {
      const description = gatewayError?.error?.description || gatewayError?.description || gatewayError?.message;
      return res.status(502).json({ message: `Razorpay could not create the payment order. ${description || "Check your Test Mode keys."}` });
    }

    const order = await Order.create({
      customer: customer._id,
      items: orderItems,
      shippingAddress: cleanedAddress,
      totalAmount,
      paymentStatus: "pending",
      orderStatus: "processing",
      razorpayOrderId: razorpayOrder.id,
    });

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully.",
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Payment order creation failed:", error.message);
    return res.status(500).json({ message: "Unable to create your order right now." });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};
    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: "Missing payment verification parameters." });
    }
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID." });
    }
    if (!razorpayCredentialsReady()) {
      return res.status(503).json({ message: "Razorpay Test Mode credentials are not configured on the backend." });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot access this order." });
    }
    if (order.paymentStatus === "paid") {
      return res.status(200).json({ success: true, message: "Payment was already verified.", order });
    }
    if (order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ message: "Razorpay order ID does not match this order." });
    }

    // HMAC uses the Razorpay order ID stored with this order, never an untrusted client value.
    const trustedOrderId = order.razorpayOrderId;
    const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${trustedOrderId}|${razorpayPaymentId}`)
      .digest("hex");
    let signatureIsValid = false;
    if (typeof razorpaySignature === "string" && /^[a-f0-9]{64}$/i.test(razorpaySignature)) {
      const expectedBytes = Buffer.from(expectedSignature, "hex");
      const receivedBytes = Buffer.from(razorpaySignature, "hex");
      signatureIsValid = expectedBytes.length === receivedBytes.length && crypto.timingSafeEqual(expectedBytes, receivedBytes);
    }
    if (!signatureIsValid) {
      return res.status(400).json({ message: "Payment signature verification failed. The order is not marked paid." });
    }

    // Claim the pending order atomically so concurrent verification requests cannot deduct stock twice.
    const paidOrder = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: "pending" },
      { $set: {
        paymentStatus: "paid",
        orderStatus: "placed",
        razorpayPaymentId,
        razorpaySignature,
        paidAt: new Date(),
      } },
      { new: true }
    );
    if (!paidOrder) {
      const latestOrder = await Order.findById(order._id);
      if (latestOrder?.paymentStatus === "paid") {
        return res.status(200).json({ success: true, message: "Payment was already verified.", order: latestOrder });
      }
      return res.status(409).json({ message: "This order is no longer awaiting payment." });
    }

    // Guard each inventory decrement. If stock changed after checkout, compensate earlier
    // decrements but still record the verified payment and preserve an auditable paid order.
    const decrementedItems = [];
    let stockIssue = "";
    for (const item of paidOrder.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updatedProduct) {
        stockIssue = item.name;
        for (const completedItem of decrementedItems) {
          await Product.updateOne({ _id: completedItem.product }, { $inc: { stock: completedItem.quantity } });
        }
        break;
      }
      decrementedItems.push(item);
    }

    const customer = await Customer.findById(req.user._id);
    if (customer) {
      customer.cart = [];
      await customer.save();
    }

    const message = stockIssue
      ? `Payment verified. Stock changed for ${stockIssue}; contact support with order ${paidOrder._id}.`
      : "Payment verified successfully.";
    return res.status(200).json({ success: true, message, order: paidOrder });
  } catch (error) {
    console.error("Payment verification failed:", error.message);
    return res.status(500).json({ message: "Unable to verify the payment right now." });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load orders." });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid order ID." });
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot view this order." });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load order details." });
  }
};

module.exports = { createPaymentOrder, verifyPayment, getOrders, getOrderById };
