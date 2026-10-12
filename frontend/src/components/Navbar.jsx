import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { getCurrentCustomer, logoutCustomer } from "../services/api";
import { useCart } from "../context/CartContext";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const { cartItems, refreshCart } = useCart();

  const cartCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  useEffect(() => {
    let active = true;
    const loadSession = async () => {
      try {
        const response = await getCurrentCustomer();
        if (!active) return;
        if (response.ok) {
          const payload = await response.json();
          setCustomer(payload.customer || null);
        } else {
          setCustomer(null);
        }
      } catch {
        if (active) setCustomer(null);
      }
      try {
        await refreshCart();
      } catch {
        // The cart context exposes its own error state.
      }
    };
    loadSession();
    return () => { active = false; };
  }, [location.pathname, refreshCart]);

  const handleLogout = async () => {
    if (logoutBusy) return;
    setLogoutBusy(true);
    try {
      const response = await logoutCustomer();
      if (!response.ok) throw new Error("Logout was not completed");
      setCustomer(null);
      await refreshCart();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Unable to log out:", error);
    } finally {
      setLogoutBusy(false);
    }
  };

  const navClass = ({ isActive }) => `nav-link${isActive ? " is-active" : ""}`;

  return (
    <header className="site-header">
      <Link to="/home" className="brand-lockup" aria-label="ShopKart home">
        <span className="brand-symbol">s<span>k</span></span>
        <span className="brand-name">ShopKart<small>GOOD FINDS, DAILY</small></span>
      </Link>

      <nav className="nav-links" aria-label="Main navigation">
        <NavLink to="/home" className={navClass}>Home</NavLink>
        <NavLink to="/products" className={navClass}>Shop</NavLink>
        {customer && <NavLink to="/wishlist" className={navClass}>Wishlist</NavLink>}
        {customer && <NavLink to="/orders" className={navClass}>Orders</NavLink>}
        {customer ? (
          <>
            <NavLink to="/cart" className="nav-cart-link" aria-label={`Cart, ${cartCount} items`}>
              Bag <span className="nav-count">{cartCount}</span>
            </NavLink>
            <span className="nav-greeting">Hi, {customer.fullName?.split(" ")[0]}</span>
            <button type="button" className="nav-logout" onClick={handleLogout} disabled={logoutBusy}>
              {logoutBusy ? "Signing out…" : "Log out"}
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={navClass}>Log in</NavLink>
            <Link to="/register" className="nav-register">Create account <span aria-hidden="true">↗</span></Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
