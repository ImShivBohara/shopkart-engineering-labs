import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Cart() {
  const { cartItems, loading, error, updateQuantity, removeFromCart, refreshCart } = useCart();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    refreshCart();
  }, []);

  const handleIncrease = async (item) => {
    if (!item.product || actionLoading) return;
    if (item.quantity >= item.product.stock) {
      setActionError(`Cannot exceed available stock (${item.product.stock})`);
      return;
    }
    setActionError("");
    setActionLoading(true);
    const res = await updateQuantity(item.product._id, item.quantity + 1);
    if (!res.success) {
      setActionError(res.message);
    }
    setActionLoading(false);
  };

  const handleDecrease = async (item) => {
    if (!item.product || actionLoading) return;
    if (item.quantity <= 1) {
      return;
    }
    setActionError("");
    setActionLoading(true);
    const res = await updateQuantity(item.product._id, item.quantity - 1);
    if (!res.success) {
      setActionError(res.message);
    }
    setActionLoading(false);
  };

  const handleRemove = async (productId) => {
    if (actionLoading) return;
    setActionError("");
    setActionLoading(true);
    const res = await removeFromCart(productId);
    if (!res.success) {
      setActionError(res.message);
    }
    setActionLoading(false);
  };

  const totalItems = cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.product ? item.product.price : 0;
    return acc + price * item.quantity;
  }, 0);

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>

      {loading && <p>Loading your cart...</p>}

      {error && (
        <div className="state-panel state-panel-error">
          <p className="error-message">{error}</p>
          <button className="button-secondary" type="button" onClick={() => refreshCart()}>
            Try again
          </button>
        </div>
      )}
      {actionError && <p className="error-message">{actionError}</p>}

      {!loading && !error && cartItems.length === 0 && (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <Link to="/products" className="continue-shopping-btn">
            Explore Products
          </Link>
        </div>
      )}

      {!loading && cartItems.length > 0 && (
        <div className="cart-layout">
          <div className="cart-items-list">
            {cartItems.map((item) => {
              const product = item.product;
              if (!product) return null;

              return (
                <div key={item._id || product._id} className="cart-item">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="cart-item-img"
                  />
                  <div className="cart-item-info">
                    <h3>{product.name}</h3>
                    <p className="cart-item-price">₹{product.price}</p>
                    <p className="cart-item-stock">Available Stock: {product.stock}</p>
                  </div>
                  <div className="cart-item-actions">
                    <div className="quantity-controls">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => handleDecrease(item)}
                        disabled={actionLoading || item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => handleIncrease(item)}
                        disabled={actionLoading || item.quantity >= product.stock}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="cart-remove-btn"
                      onClick={() => handleRemove(product._id)}
                      disabled={actionLoading}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Total Items:</span>
              <span>{totalItems}</span>
            </div>
            <div className="summary-row summary-total">
              <span>Subtotal:</span>
              <span>₹{subtotal}</span>
            </div>
            <button
              type="button"
              className="checkout-btn"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
