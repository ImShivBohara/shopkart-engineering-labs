import { useState } from "react";
import { Link } from "react-router-dom";
import { addToWishlist } from "../services/api";
import { useCart } from "../context/CartContext";

function ProductCard({ product, onRemove, isWishlist }) {
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState(false);
  const { addToCart } = useCart();

  const handleAddToWishlist = async () => {
    if (wishlistLoading) return;
    setWishlistLoading(true);
    setStatusMessage("");
    setStatusError(false);
    try {
      const response = await addToWishlist(product._id);
      const data = await response.json();
      if (response.ok) setStatusMessage("Saved to your wishlist");
      else {
        setStatusError(true);
        setStatusMessage(data.message || "Couldn't save this item");
      }
    } catch {
      setStatusError(true);
      setStatusMessage("Couldn't reach the server. Try again.");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (cartLoading || Number(product.stock) < 1) return;
    setCartLoading(true);
    setStatusMessage("");
    setStatusError(false);
    try {
      const result = await addToCart(product._id);
      setStatusMessage(result.success ? "Added to your bag" : (result.message || "Couldn't add this item"));
      setStatusError(!result.success);
    } catch {
      setStatusError(true);
      setStatusMessage("Couldn't reach the server. Try again.");
    } finally {
      setCartLoading(false);
    }
  };

  return (
    <article className="product-card">
      <div className="product-card-visual">
        <Link to={`/products/${product._id}`} className="product-image-link" aria-label={`View ${product.name}`}>
          <img src={product.image} alt={product.name} className="product-card-img" loading="lazy" />
        </Link>
        <span className={`stock-chip${Number(product.stock) === 0 ? " stock-chip-out" : ""}`}>{Number(product.stock) === 0 ? "Sold out" : `${product.stock} in stock`}</span>
        <span className="product-index-mark">SK / FIND</span>
      </div>
      <div className="product-card-body">
        <div className="product-meta-line"><span className="product-category">{product.category}</span><span className="product-card-arrow" aria-hidden="true">↗</span></div>
        <h3><Link to={`/products/${product._id}`}>{product.name}</Link></h3>
        <div className="product-card-bottom"><p className="product-price">₹{Number(product.price).toLocaleString("en-IN")}</p><Link to={`/products/${product._id}`} className="quick-view-link">View item <span aria-hidden="true">→</span></Link></div>
        <div className="product-card-actions">
          <button type="button" className="card-add-to-cart-btn" disabled={cartLoading || Number(product.stock) === 0} onClick={handleAddToCart}>{cartLoading ? "Adding…" : Number(product.stock) === 0 ? "Out of stock" : "Add to bag +"}</button>
          {isWishlist ? (
            <button type="button" className="remove-wishlist-btn" onClick={() => onRemove(product._id)}>Remove saved item</button>
          ) : (
            <button type="button" className="wishlist-btn" disabled={wishlistLoading} onClick={handleAddToWishlist} aria-label={`Save ${product.name} to wishlist`}>{wishlistLoading ? "Saving…" : "♡ Save"}</button>
          )}
        </div>
        {statusMessage && <p className={`card-status-msg${statusError ? " status-error" : ""}`} role="status">{statusMessage}</p>}
      </div>
    </article>
  );
}

export default ProductCard;
