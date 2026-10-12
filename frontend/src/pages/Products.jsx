import { useEffect, useState } from "react";
import { getCategories, getProducts } from "../services/api";
import ProductCard from "../components/ProductCard";

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        const data = await response.json();
        if (!active) return;
        if (response.ok) {
          setCategories(data.categories || []);
        }
      } catch {
        // Category dropdown can remain empty; product fetch still proceeds.
      }
    };
    fetchCategories();
    return () => { active = false; };
  }, [retryCount]);

  useEffect(() => {
    let active = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getProducts({ search: search.trim(), category });
        const data = await response.json();
        if (!active) return;
        if (response.ok) setProducts(data.products || []);
        else setError(data.message || "Couldn't load the catalogue.");
      } catch {
        if (active) setError("Something went wrong while loading products.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProducts();
    return () => { active = false; };
  }, [search, category, retryCount]);

  useEffect(() => {
    if (category && categories.length > 0 && !categories.includes(category)) {
      setCategory("");
    }
  }, [categories, category]);

  return (
    <main className="products-page">
      <header className="page-heading products-heading">
        <div><span className="section-kicker">THE SHOPKART COLLECTION</span><h1>Find your <em>favourite.</em></h1><p>Browse the collection and discover something worth keeping.</p></div>
        <span className="page-heading-stamp">SELECTED<br />FOR YOU <b>↘</b></span>
      </header>

      <section className="catalogue-tools" aria-label="Search and filter products">
        <label className="catalogue-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Search products" placeholder="Search by product name" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>SEARCH</kbd></label>
        <label className="catalogue-filter"><span>SHOW</span><select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      </section>

      <div className="catalogue-result-line"><span>{loading ? "Looking through the collection…" : `${products.length} ${products.length === 1 ? "item" : "items"} to explore`}</span><span>SHOPKART / 01</span></div>
      {loading && <div className="state-panel"><span className="loading-dot" /><p>Loading products…</p></div>}
      {error && <div className="state-panel state-panel-error"><p className="error-message">{error}</p><button className="button-secondary" type="button" onClick={() => setRetryCount((count) => count + 1)}>Try again</button></div>}
      {!loading && !error && products.length === 0 && <div className="state-panel"><span className="state-symbol">⌕</span><h2>No products found.</h2><p>Try another name or clear the category filter.</p><button type="button" className="button-secondary" onClick={() => { setSearch(""); setCategory(""); }}>Clear filters</button></div>}
      {!loading && !error && products.length > 0 && <div className="products-grid">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>}
    </main>
  );
}

export default Products;
