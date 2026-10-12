import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentCustomer } from "../services/api";

function Home() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const response = await getCurrentCustomer();
        if (response.status === 401 || !response.ok) {
          navigate("/login", { replace: true });
          return;
        }
        const data = await response.json();
        if (active) setCustomer(data.customer || null);
      } catch {
        navigate("/login", { replace: true });
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProfile();
    return () => { active = false; };
  }, [navigate]);

  if (loading) {
    return <main className="home-page"><div className="loading-panel"><span className="loading-dot" /> Loading your ShopKart profile…</div></main>;
  }

  if (!customer) return null;

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="eyebrow"><span className="eyebrow-mark" /> YOUR EVERYDAY EDIT</p>
          <h1>Good things.<br /><em>Found here.</em></h1>
          <p className="home-intro">A considered collection for the things you use, wear and keep close. Find your next favourite, all in one place.</p>
          <div className="hero-actions">
            <Link to="/products" className="button-primary">Explore the shop <span aria-hidden="true">↗</span></Link>
            <Link to="/wishlist" className="text-link">Your saved pieces <span aria-hidden="true">→</span></Link>
          </div>
          <div className="hero-footnote"><span className="footnote-line" /> A little better, every day.</div>
        </div>
        <div className="home-hero-art" aria-label="ShopKart editorial artwork">
          <div className="art-sun" />
          <div className="art-oval art-oval-back" />
          <div className="art-oval art-oval-front" />
          <div className="art-block art-block-one" />
          <div className="art-block art-block-two" />
          <div className="art-note"><span>THE</span><strong>GOOD<br />PICK</strong><small>ShopKart · No. 01</small></div>
          <span className="art-side-label">CURATED FOR EVERYDAY</span>
        </div>
      </section>

      <section className="account-strip" aria-label="Your customer profile">
        <div className="account-strip-intro">
          <span className="section-kicker">YOUR SPACE</span>
          <h2>Welcome back, {customer.fullName.split(" ")[0]}.</h2>
          <p>Your ShopKart account, right where you left it.</p>
        </div>
        <div className="account-detail"><span>FULL NAME</span><strong>{customer.fullName}</strong></div>
        <div className="account-detail"><span>EMAIL ADDRESS</span><strong>{customer.email}</strong></div>
        <div className="account-detail"><span>PHONE NUMBER</span><strong>{customer.phone}</strong></div>
      </section>

      <section className="home-next-step">
        <div><span className="section-kicker">READY WHEN YOU ARE</span><h2>Take a look around.</h2></div>
        <Link to="/products" className="circle-arrow-link" aria-label="Browse products">↗</Link>
      </section>
    </main>
  );
}

export default Home;
