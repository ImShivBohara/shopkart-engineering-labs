const express = require("express");

const {
  createProduct,
  getProducts,
  getProductById,
  getCategories,
} = require("../controllers/product.controller");

const router = express.Router();

router.post("/", createProduct);
router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/:id", getProductById);

module.exports = router;