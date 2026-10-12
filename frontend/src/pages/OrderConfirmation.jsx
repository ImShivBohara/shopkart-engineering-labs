import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderById } from "../services/api";

const SUCCESS_ORDER_STATUSES = new Set(["placed", "confirmed", "shipped", "delivered"]);

function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getOrderById(id);
        const data = await response.json();
        if (response.ok) {
          setOrder(data.order);
        } else {
          setError(data.message || "Failed to load order confirmation");
        }
      } catch (err) {
        setError("Error connecting to server to retrieve order.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="order-confirmation-page">
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-confirmation-page">
        <p className="error-message">{error || "Order not found"}</p>
        <Link to="/orders" className="continue-shopping-btn">
          View My Orders
        </Link>
      </div>
    );
  }

  const isSuccessfulPayment =
    order.paymentStatus === "paid" && SUCCESS_ORDER_STATUSES.has(order.orderStatus);

  if (!isSuccessfulPayment) {
    return (
      <div className="order-confirmation-page">
        <div className="confirmation-header">
          <h1>Payment not confirmed</h1>
          <p className="confirmation-subtitle">
            This order is not marked as successfully paid yet. If you were charged,
            wait a moment and check My Orders, or contact support with your order ID.
          </p>
        </div>

        <div className="order-card">
          <div className="order-header-info">
            <div>
              <span className="info-label">Order ID:</span>
              <span className="order-id-value">{order._id}</span>
            </div>
            <div>
              <span className="info-label">Payment:</span>
              <span className={`status-badge status-${order.paymentStatus}`}>
                {order.paymentStatus.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="info-label">Order Status:</span>
              <span className={`status-badge status-${order.orderStatus}`}>
                {order.orderStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="confirmation-actions">
          <Link to="/orders" className="view-orders-btn">
            View My Orders
          </Link>
          <Link to="/checkout" className="continue-shopping-btn">
            Return to Checkout
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation-page">
      <div className="confirmation-header">
        <div className="success-icon">✓</div>
        <h1>Order Confirmed!</h1>
        <p className="confirmation-subtitle">
          Thank you for your purchase. Your payment was successfully verified.
        </p>
      </div>

      <div className="order-card">
        <div className="order-header-info">
          <div>
            <span className="info-label">Order ID:</span>
            <span className="order-id-value">{order._id}</span>
          </div>
          <div>
            <span className="info-label">Date:</span>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="info-label">Payment:</span>
            <span className={`status-badge status-${order.paymentStatus}`}>
              {order.paymentStatus.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="info-label">Order Status:</span>
            <span className={`status-badge status-${order.orderStatus}`}>
              {order.orderStatus.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="order-section">
          <h3>Shipping Address</h3>
          <p className="shipping-text">
            <strong>{order.shippingAddress?.fullName}</strong>
            <br />
            {order.shippingAddress?.addressLine1}
            <br />
            {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
            {order.shippingAddress?.pincode}
            <br />
            Phone: {order.shippingAddress?.phone}
          </p>
        </div>

        <div className="order-section">
          <h3>Purchased Items</h3>
          <div className="order-items-table">
            {order.items.map((item, index) => (
              <div key={item._id || index} className="order-item-row">
                {item.image && (
                  <img src={item.image} alt={item.name} className="order-item-img" />
                )}
                <div className="order-item-details">
                  <h4>{item.name}</h4>
                  <p>
                    ₹{item.price} × {item.quantity}
                  </p>
                </div>
                <div className="order-item-total">
                  ₹{item.price * item.quantity}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-summary-row">
          <span>Total Paid:</span>
          <span className="order-total-amount">₹{order.totalAmount}</span>
        </div>
      </div>

      <div className="confirmation-actions">
        <Link to="/orders" className="view-orders-btn">
          View All Orders
        </Link>
        <Link to="/products" className="continue-shopping-btn">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default OrderConfirmation;
