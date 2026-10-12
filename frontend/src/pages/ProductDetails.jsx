import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getProductById } from "../services/api";
import { useCart } from "../context/CartContext";

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartLoading, setCartLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getProductById(id);
        const data = await response.json();

        if (response.ok) {
          setProduct(data.product);
        } else {
          setError(data.message || "Product not found");
        }
      } catch (err) {
        setError("Failed to connect to server. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (cartLoading || !product) return;
    setCartLoading(true);
    setStatusMessage("");
    const res = await addToCart(product._id);
    if (res.success) {
      setStatusMessage("Added to cart!");
    } else {
      setStatusMessage(res.message || "Failed to add to cart");
    }
    setCartLoading(false);
  };

  if (loading) {
    return (
      <div className="product-details-container">
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-container">
        <p className="error-message">{error || "Product not found"}</p>
        <Link to="/products">Back to Products</Link>
      </div>
    );
  }

  return (
    <div className="product-details-container">
      <Link to="/products" className="back-link">
        &larr; Back to Products
      </Link>

      <div className="product-details-content">
        <img
          src={product.image}
          alt={product.name}
          className="product-details-img"
        />

        <div className="product-details-info">
          <h1>{product.name}</h1>
          <p className="product-details-desc">{product.description}</p>
          <p className="product-price">₹{product.price}</p>
          <p className="product-category">Category: {product.category}</p>
          <p className="product-stock">Stock: {product.stock}</p>

          <button
            type="button"
            className="add-to-cart-btn"
            disabled={cartLoading || product.stock === 0}
            onClick={handleAddToCart}
          >
            {cartLoading ? "Adding..." : product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
          {statusMessage && <p className="card-status-msg">{statusMessage}</p>}
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
