const Customer = require("../models/customer.model");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body || {};
    if (![fullName, email, password, phone].every((value) => typeof value === "string" && value.trim())) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });

    const normalizedEmail = email.trim().toLowerCase();
    const existingCustomer = await Customer.findOne({ email: normalizedEmail });
    if (existingCustomer) return res.status(409).json({ message: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = await Customer.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: { _id: customer._id, fullName: customer.fullName, email: customer.email, phone: customer.phone },
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Email already registered." });
    console.error("Customer registration failed:", error.message);
    return res.status(500).json({ message: "Unable to register this customer right now." });
  }
};

const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const customer = await Customer.findOne({ email: email.trim().toLowerCase() });
    if (!customer || !(await bcrypt.compare(password, customer.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(customer._id);
    res.cookie("authToken", token, cookieOptions());
    return res.status(200).json({
      success: true,
      message: "Login successful",
      customer: { _id: customer._id, fullName: customer.fullName, email: customer.email, phone: customer.phone },
    });
  } catch (error) {
    console.error("Customer login failed:", error.message);
    return res.status(500).json({ message: "Unable to log in right now." });
  }
};

const getCurrentCustomer = (req, res) => res.status(200).json({ customer: req.user });

const logoutCustomer = (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

module.exports = { registerCustomer, loginCustomer, getCurrentCustomer, logoutCustomer };
