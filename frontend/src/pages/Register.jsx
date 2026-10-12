import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerCustomer } from "../services/api";

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Choose a password with at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const response = await registerCustomer({ fullName: fullName.trim(), email: email.trim(), password, phone: phone.trim() });
      const data = await response.json();
      if (response.ok) navigate("/login", { replace: true, state: { registered: true } });
      else setError(data.message || "We couldn't create your account.");
    } catch {
      setError("We couldn't reach ShopKart. Check the server and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-page-register">
      <aside className="auth-story auth-story-register">
        <span className="auth-story-mark">sk.</span>
        <div><span className="section-kicker">A GOOD PLACE TO START</span><h1>Make room<br />for <em>something</em><br />good.</h1><p>Create your account to keep your wishlist, shopping bag and orders together.</p></div>
        <span className="auth-story-bottom">SHOPKART / YOUR EVERYDAY EDIT</span>
      </aside>
      <section className="auth-card">
        <div className="auth-card-heading"><span className="section-kicker">JOIN SHOPKART</span><h2>Create your account.</h2><p>A few details and you're all set.</p></div>
        {error && <p className="error-message" role="alert">{error}</p>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group"><label htmlFor="register-name">Full name</label><input id="register-name" type="text" autoComplete="name" placeholder="Your full name" value={fullName} onChange={(event) => setFullName(event.target.value)} required /></div>
          <div className="form-group"><label htmlFor="register-email">Email address</label><input id="register-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          <div className="form-row auth-form-row">
            <div className="form-group"><label htmlFor="register-password">Password</label><input id="register-password" type="password" autoComplete="new-password" minLength={6} placeholder="6+ characters" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
            <div className="form-group"><label htmlFor="register-phone">Phone number</label><input id="register-phone" type="tel" autoComplete="tel" placeholder="9876543210" value={phone} onChange={(event) => setPhone(event.target.value)} required /></div>
          </div>
          <button type="submit" className="button-primary auth-submit" disabled={loading}>{loading ? "Creating your account…" : "Create account"}<span aria-hidden="true">→</span></button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        <p className="auth-note">Your details are used to manage your ShopKart account and orders.</p>
      </section>
    </main>
  );
}

export default Register;
