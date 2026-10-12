import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrderById } from "../services/api";

function OrderDetails() {
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
          setError(data.message || "Failed to load order details");
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
      <div className="order-details-page">
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-page">
        <p className="error-message">{error || "Order not found"}</p>
        <Link to="/orders" className="back-link">
          &larr; Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="order-details-page">
      <Link to="/orders" className="back-link">
        &larr; Back to My Orders
      </Link>

      <div className="order-details-card">
        <div className="order-details-header">
          <div>
            <h1>Order #{order._id}</h1>
            <p className="order-date-text">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at{" "}
              {new Date(order.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <div className="order-badges-container">
            <span className={`status-badge status-${order.paymentStatus}`}>
              Payment: {order.paymentStatus.toUpperCase()}
            </span>
            <span className={`status-badge status-${order.orderStatus}`}>
              Order: {order.orderStatus.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="order-details-grid">
          <div className="order-info-block">
            <h3>Shipping Details</h3>
            <p>
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

          <div className="order-info-block">
            <h3>Payment Information</h3>
            <p>
              <strong>Gateway:</strong> Razorpay (Test Mode)
              <br />
              <strong>Razorpay Order ID:</strong> {order.razorpayOrderId}
              <br />
              {order.razorpayPaymentId && (
                <>
                  <strong>Payment ID:</strong> {order.razorpayPaymentId}
                  <br />
                </>
              )}
              {order.paidAt && (
                <>
                  <strong>Paid At:</strong> {new Date(order.paidAt).toLocaleString()}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="order-items-section">
          <h3>Items Snapshot</h3>
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

        <div className="order-details-footer">
          <div className="order-summary-row">
            <span>Total Amount:</span>
            <span className="order-total-amount">₹{order.totalAmount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
