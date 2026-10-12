import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginCustomer } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await loginCustomer({ email: email.trim(), password });
      const data = await response.json();
      if (response.ok) navigate("/home", { replace: true });
      else setError(response.status === 401 ? "Those details don't match an account. Try again." : (data.message || "Unable to log in."));
    } catch {
      setError("We couldn't reach ShopKart. Check the server and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <aside className="auth-story">
        <span className="auth-story-mark">sk.</span>
        <div><span className="section-kicker">GOOD TO SEE YOU</span><h1>Your next<br /><em>good find</em><br />starts here.</h1><p>Sign in to pick up where you left off—your cart, wishlist and orders are waiting.</p></div>
        <span className="auth-story-bottom">SHOPKART / EVERYDAY, WELL FOUND</span>
      </aside>
      <section className="auth-card">
        <div className="auth-card-heading"><span className="section-kicker">YOUR SHOPKART ACCOUNT</span><h2>Welcome back.</h2><p>Enter your details to continue.</p></div>
        {location.state?.registered && <p className="success-message" role="status">Your account is ready. Sign in to continue.</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group"><label htmlFor="login-email">Email address</label><input id="login-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          <div className="form-group"><label htmlFor="login-password">Password</label><input id="login-password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
          <button type="submit" className="button-primary auth-submit" disabled={loading}>{loading ? "Signing you in…" : "Sign in to ShopKart"}<span aria-hidden="true">→</span></button>
        </form>
        <p className="auth-switch">New to ShopKart? <Link to="/register">Create an account</Link></p>
        <p className="auth-note">Your sign-in is protected by a secure session.</p>
      </section>
    </main>
  );
}

export default Login;
