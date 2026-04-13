import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function BrandList() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/brands')
      .then(r => r.json())
      .then(res => setBrands(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(148,163,184,0.7)' }}>
      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>◌</div>
      Loading brands...
    </div>
  );

  return (
    <div>
      {/* Hero header */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(129,140,248,0.1)',
          border: '1px solid rgba(129,140,248,0.2)',
          borderRadius: 999, padding: '5px 14px', marginBottom: 16,
        }}>
          <span style={{ color: '#818cf8', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            AI-Powered Ad Creation
          </span>
        </div>
        <h1 style={{
          fontSize: 42, fontWeight: 800, color: '#f1f5f9',
          letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 12,
        }}>
          Your <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Brand DNAs</span>
        </h1>
        <p style={{ color: 'rgba(148,163,184,0.8)', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>
          Define your brand identity once. Generate on-brand ad images forever.
        </p>
      </div>

      {brands.length === 0 ? (
        <div className="glass-card" style={{
          padding: 60, textAlign: 'center', maxWidth: 480, margin: '0 auto',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>✦</div>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: '#f1f5f9', marginBottom: 8 }}>No brands yet</h3>
          <p style={{ color: 'rgba(148,163,184,0.7)', marginBottom: 24, fontSize: 14 }}>
            Create your first Brand DNA to start generating stunning ad images.
          </p>
          <Link to="/brands/new">
            <button className="btn-primary">Create Your First Brand</button>
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ color: 'rgba(148,163,184,0.6)', fontSize: 13 }}>
              {brands.length} brand{brands.length !== 1 ? 's' : ''}
            </span>
            <Link to="/brands/new">
              <button className="btn-primary" style={{ fontSize: 13, padding: '8px 18px' }}>+ New Brand</button>
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {brands.map(brand => (
              <Link key={brand.id} to={`/brands/${brand.id}`} style={{ textDecoration: 'none' }}>
                <div className="glass-card" style={{ padding: 24, cursor: 'pointer' }}>
                  {/* Color strip */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                    {parseColors(brand.colors).slice(0, 6).map((c, i) => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: c,
                        boxShadow: `0 0 8px ${c}66`,
                      }} />
                    ))}
                  </div>

                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8, letterSpacing: '-0.3px' }}>
                    {brand.name}
                  </h2>
                  <p style={{
                    fontSize: 13, color: 'rgba(148,163,184,0.7)',
                    lineHeight: 1.5, marginBottom: 16,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {brand.overview}
                  </p>

                  {/* Color dots */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {parseColors(brand.colors).slice(0, 5).map((c, i) => (
                      <div key={i} style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: c,
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: `0 0 8px ${c}55`,
                      }} />
                    ))}
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(129,140,248,0.8)', fontWeight: 600 }}>
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function parseColors(str) {
  try { return JSON.parse(str); } catch { return []; }
}
