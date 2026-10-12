import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getOrders } from "../services/api";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getOrders();
        if (response.status === 401) {
          navigate("/login");
          return;
        }

        const data = await response.json();
        if (response.ok) {
          setOrders(data.orders || []);
        } else {
          setError(data.message || "Failed to load orders");
        }
      } catch (err) {
        setError("Error connecting to server to fetch orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  return (
    <div className="orders-page">
      <h1>My Orders</h1>

      {loading && <p>Loading your orders...</p>}

      {error && <p className="error-message">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <div className="empty-state">
          <p>You have not placed any orders yet.</p>
          <Link to="/products" className="continue-shopping-btn">
            Explore Products
          </Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-summary-card">
              <div className="order-summary-card-header">
                <div>
                  <span className="order-card-label">Order #</span>
                  <span className="order-card-id">{order._id}</span>
                </div>
                <div>
                  <span className="order-card-label">Placed on</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="order-card-label">Total</span>
                  <span className="order-card-total">₹{order.totalAmount}</span>
                </div>
                <div>
                  <span className={`status-badge status-${order.paymentStatus}`}>
                    {order.paymentStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="order-summary-card-body">
                <div className="order-items-preview">
                  {order.items.map((item, index) => (
                    <div key={item._id || index} className="preview-item">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="preview-item-img" />
                      )}
                      <div>
                        <p className="preview-item-name">{item.name}</p>
                        <p className="preview-item-meta">
                          Qty: {item.quantity} | ₹{item.price} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-card-actions">
                  <Link to={`/orders/${order._id}`} className="view-details-btn">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
