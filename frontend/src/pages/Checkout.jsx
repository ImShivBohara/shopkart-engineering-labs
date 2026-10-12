import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createPaymentOrder, verifyPayment } from "../services/api";

const loadRazorpayScript = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
  if (existingScript) {
    existingScript.addEventListener("load", () => resolve(true), { once: true });
    existingScript.addEventListener("error", () => resolve(false), { once: true });
    return;
  }
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.async = true;
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

function Checkout() {
  const { cartItems, loading: cartLoading, refreshCart } = useCart();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => { refreshCart(); }, [refreshCart]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    if (formErrors[name]) setFormErrors((previous) => ({ ...previous, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    ["fullName", "phone", "addressLine1", "city", "state", "pincode"].forEach((field) => {
      if (!formData[field].trim()) errors[field] = "This field is required.";
    });
    const digits = formData.phone.replace(/\D/g, "");
    if (formData.phone.trim() && (digits.length < 10 || digits.length > 15)) {
      errors.phone = "Enter a valid phone number (10–15 digits).";
    }
    if (formData.pincode.trim() && !/^\d{6}$/.test(formData.pincode.trim())) {
      errors.pincode = "Pincode must be a 6-digit number.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePayment = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    if (!validateForm()) return;
    if (!cartItems.length) {
      setErrorMessage("Your bag is empty. Add an item before checking out.");
      return;
    }
    setSubmitting(true);
    try {
      const shippingAddress = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        addressLine1: formData.addressLine1.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      };
      const response = await createPaymentOrder(shippingAddress);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to prepare your payment.");

      if (!data.keyId || !data.razorpayOrderId || !data.orderId || !data.amount) {
        throw new Error("The payment setup is incomplete. Check the backend Razorpay Test Mode keys.");
      }
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) throw new Error("Razorpay Checkout could not load. Check your internet connection and try again.");

      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "ShopKart",
        description: "Your ShopKart order",
        order_id: data.razorpayOrderId,
        prefill: { name: shippingAddress.fullName, contact: shippingAddress.phone },
        theme: { color: "#244d3c" },
        handler: async (payment) => {
          setSubmitting(true);
          try {
            const verification = await verifyPayment({
              orderId: data.orderId,
              razorpayOrderId: payment.razorpay_order_id,
              razorpayPaymentId: payment.razorpay_payment_id,
              razorpaySignature: payment.razorpay_signature,
            });
            const result = await verification.json();
            if (!verification.ok) throw new Error(result.message || "Payment verification failed.");
            await refreshCart();
            navigate(`/order-confirmation/${data.orderId}`, { replace: true });
          } catch (error) {
            setErrorMessage(error.message || "We couldn't verify the payment. Your bag has not been cleared.");
            setSubmitting(false);
          }
        },
      });

      checkout.on("payment.failed", (eventData) => {
        setErrorMessage(eventData?.error?.description || "Payment failed. Your bag has been kept unchanged; please try again.");
        setSubmitting(false);
      });
      checkout.on("payment.error", () => {
        setErrorMessage("Payment could not be completed. Your bag has been kept unchanged.");
        setSubmitting(false);
      });
      checkout.open();
      setSubmitting(false);
    } catch (error) {
      setErrorMessage(error.message || "Failed to start secure checkout. Please try again.");
      setSubmitting(false);
    }
  };

  const totalItems = cartItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.product ? item.product.price : 0;
    return acc + price * (item.quantity || 1);
  }, 0);

  if (cartLoading) {
    return (
      <div className="checkout-page">
        <p>Loading checkout...</p>
      </div>
    );
  }

  if (!cartLoading && cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <h1>Checkout</h1>
        <div className="empty-state">
          <p>Your cart is empty. You cannot proceed to checkout.</p>
          <Link to="/products" className="continue-shopping-btn">
            Explore Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <div className="checkout-layout">
        <div className="checkout-form-container">
          <h2>Shipping Address</h2>
          <form onSubmit={handlePayment} className="checkout-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                autoComplete="name"
              />
              {formErrors.fullName && <span className="field-error">{formErrors.fullName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                autoComplete="tel"
              />
              {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="addressLine1">Address Line 1</label>
              <input
                id="addressLine1"
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                placeholder="123 Main Street, Apt 4B"
                autoComplete="address-line1"
              />
              {formErrors.addressLine1 && <span className="field-error">{formErrors.addressLine1}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  autoComplete="address-level2"
                />
                {formErrors.city && <span className="field-error">{formErrors.city}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="state">State</label>
                <input
                  id="state"
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Maharashtra"
                  autoComplete="address-level1"
                />
                {formErrors.state && <span className="field-error">{formErrors.state}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="pincode">Pincode</label>
              <input
                id="pincode"
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="400001"
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
              />
              {formErrors.pincode && <span className="field-error">{formErrors.pincode}</span>}
            </div>

            <button type="submit" className="pay-now-btn" disabled={submitting}>
              {submitting ? "Opening secure checkout…" : `Pay securely · ₹${subtotal.toLocaleString("en-IN")}`}
            </button>
          </form>
        </div>

        <div className="checkout-summary">
          <h2>Order Summary</h2>
          <div className="summary-items-list">
            {cartItems.map((item) => {
              const product = item.product;
              if (!product) return null;
              return (
                <div key={item._id || product._id} className="summary-item-row">
                  <span className="item-title">
                    {product.name} × {item.quantity}
                  </span>
                  <span className="item-price">₹{product.price * item.quantity}</span>
                </div>
              );
            })}
          </div>

          <div className="summary-row">
            <span>Total Items:</span>
            <span>{totalItems}</span>
          </div>

          <div className="summary-row summary-total">
            <span>Total Amount:</span>
            <span>₹{subtotal}</span>
          </div>

          <p className="payment-security-note">
            Secured by Razorpay Standard Checkout · Test Mode
          </p>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
