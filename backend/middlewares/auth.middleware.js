const jwt = require("jsonwebtoken");
const Customer = require("../models/customer.model");

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const customer = await Customer.findById(decoded.userId).select(
      "-password"
    );

    if (!customer) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    req.user = customer;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized"
    });
  }
};

module.exports = authMiddleware;