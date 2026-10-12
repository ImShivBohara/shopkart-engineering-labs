import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getWishlist, removeFromWishlist } from "../services/api";
import ProductCard from "../components/ProductCard";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const navigate = useNavigate();

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getWishlist();
      if (response.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      const data = await response.json();
      if (response.ok) setWishlist(data.wishlist || []);
      else setError(data.message || "We couldn't load your saved items.");
    } catch {
      setError("Something went wrong. We couldn't load your wishlist.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const handleRemove = async (productId) => {
    setActionError("");
    try {
      const response = await removeFromWishlist(productId);
      if (response.ok) setWishlist((items) => items.filter((item) => item._id !== productId));
      else {
        const data = await response.json();
        setActionError(data.message || "Couldn't remove this item.");
      }
    } catch {
      setActionError("Couldn't reach the server. Please try again.");
    }
  };

  return (
    <main className="products-page wishlist-page">
      <header className="page-heading"><div><span className="section-kicker">THE THINGS YOU KEPT</span><h1>Your <em>wishlist.</em></h1><p>All your saved pieces, gathered in one place.</p></div><span className="wishlist-count">{wishlist.length.toString().padStart(2, "0")} <small>SAVED</small></span></header>
      {actionError && <p className="error-message" role="alert">{actionError}</p>}
      {loading && <div className="state-panel"><span className="loading-dot" /><p>Loading your wishlist…</p></div>}
      {error && <div className="state-panel state-panel-error"><p className="error-message">{error}</p><button type="button" className="button-secondary" onClick={fetchWishlist}>Try again</button></div>}
      {!loading && !error && wishlist.length === 0 && <div className="state-panel empty-wishlist"><span className="state-symbol">♡</span><h2>Nothing saved. Yet.</h2><p>When something catches your eye, save it here for later.</p><Link to="/products" className="button-primary">Browse the collection <span aria-hidden="true">→</span></Link></div>}
      {!loading && !error && wishlist.length > 0 && <div className="products-grid">{wishlist.map((product) => <ProductCard key={product._id} product={product} isWishlist onRemove={handleRemove} />)}</div>}
    </main>
  );
}

export default Wishlist;
