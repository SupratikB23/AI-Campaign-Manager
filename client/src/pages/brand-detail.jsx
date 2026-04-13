import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const AD_TYPES = [
  { value: 'social', label: 'Social Media' },
  { value: 'banner', label: 'Banner' },
  { value: 'print', label: 'Print' },
  { value: 'product', label: 'Product Shot' },
  { value: 'promo', label: 'Promo Graphic' },
];

export default function BrandDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', description: '', ad_type: 'social' });

  useEffect(() => {
    fetch(`/api/brands/${id}`).then(r => r.json()).then(r => setBrand(r.data));
    loadCampaigns();
  }, [id]);

  function loadCampaigns() {
    fetch(`/api/brands/${id}/campaigns`).then(r => r.json()).then(r => setCampaigns(r.data || []));
  }

  async function handleDelete() {
    if (!confirm('Delete this brand and all its campaigns?')) return;
    await fetch(`/api/brands/${id}`, { method: 'DELETE' });
    navigate('/');
  }

  async function createCampaign(e) {
    e.preventDefault();
    const res = await fetch(`/api/brands/${id}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCampaign),
    });
    if (res.ok) {
      setNewCampaign({ name: '', description: '', ad_type: 'social' });
      setShowForm(false);
      loadCampaigns();
    }
  }

  if (!brand) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(148,163,184,0.7)' }}>Loading...</div>
  );

  const colors = safeJson(brand.colors, []);
  const values = safeJson(brand.brand_values, []);

  return (
    <div>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{ fontSize: 13, color: 'rgba(129,140,248,0.8)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24 }}>
          ← All Brands
        </span>
      </Link>

      {/* Brand Header */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        {/* Color bar */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 20, height: 5, borderRadius: 3, overflow: 'hidden' }}>
          {colors.map((c, i) => (
            <div key={i} style={{ flex: 1, background: c, boxShadow: `0 0 10px ${c}88` }} />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 1, minWidth: 0 }}>
            {brand.logo_path && (
              <div style={{
                width: 72, height: 72, borderRadius: 12,
                background: 'rgba(255,255,255,0.95)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 8, flexShrink: 0,
                boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                <img
                  src={`/static/generated/${brand.logo_path}`}
                  alt={`${brand.name} logo`}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 30, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px', marginBottom: 6 }}>
                {brand.name}
              </h1>
              {brand.tagline && (
                <p style={{ fontSize: 14, color: 'rgba(148,163,184,0.7)', fontStyle: 'italic' }}>"{brand.tagline}"</p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={`/brands/${id}/edit`}>
              <button className="btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}>Edit</button>
            </Link>
            <button onClick={handleDelete} className="btn-danger" style={{ padding: '8px 16px' }}>Delete</button>
          </div>
        </div>
      </div>

      {/* DNA Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Colors */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="label" style={{ marginBottom: 12 }}>Color Palette</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {colors.map((c, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: c, border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: `0 0 12px ${c}55`,
                }} />
                <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.6)', letterSpacing: '0.05em' }}>{c.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="label" style={{ marginBottom: 12 }}>Brand Values</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {values.map((v, i) => (
              <span key={i} className="badge">{v}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="label" style={{ marginBottom: 8 }}>Aesthetic</div>
          <p style={{ fontSize: 13, color: 'rgba(203,213,225,0.9)', lineHeight: 1.6 }}>{brand.aesthetic}</p>
        </div>
        <div className="glass-card" style={{ padding: 20 }}>
          <div className="label" style={{ marginBottom: 8 }}>Tone of Voice</div>
          <p style={{ fontSize: 13, color: 'rgba(203,213,225,0.9)', lineHeight: 1.6 }}>{brand.tone}</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 20, marginBottom: 32 }}>
        <div className="label" style={{ marginBottom: 8 }}>Business Overview</div>
        <p style={{ fontSize: 13, color: 'rgba(203,213,225,0.9)', lineHeight: 1.6 }}>{brand.overview}</p>
        {(brand.website || brand.fonts) && (
          <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {brand.website && (
              <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>🌐 {brand.website}</span>
            )}
            {brand.fonts && (
              <span style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>Aa {brand.fonts}</span>
            )}
          </div>
        )}
      </div>

      {/* Campaigns */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px' }}>Campaigns</h2>
          <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.5)', marginTop: 2 }}>{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ fontSize: 13, padding: '9px 18px' }}>
          + New Campaign
        </button>
      </div>

      {showForm && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 16, borderColor: 'rgba(129,140,248,0.2)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.7)', marginBottom: 16 }}>
            New Campaign
          </div>
          <form onSubmit={createCampaign}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <input
                className="glass-input"
                value={newCampaign.name}
                onChange={e => setNewCampaign(c => ({ ...c, name: e.target.value }))}
                placeholder="Campaign name"
                required
              />
              <input
                className="glass-input"
                value={newCampaign.description}
                onChange={e => setNewCampaign(c => ({ ...c, description: e.target.value }))}
                placeholder="Campaign goal or description"
              />
              <select
                className="glass-input"
                value={newCampaign.ad_type}
                onChange={e => setNewCampaign(c => ({ ...c, ad_type: e.target.value }))}
                style={{ cursor: 'pointer' }}
              >
                {AD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn-primary" style={{ fontSize: 13 }}>Create Campaign</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ fontSize: 13 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="glass-card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'rgba(148,163,184,0.5)', fontSize: 14 }}>
            No campaigns yet. Create one to start generating ads.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {campaigns.map(c => (
            <Link key={c.id} to={`/campaigns/${c.id}`} style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 3 }}>{c.name}</h3>
                  {c.description && <p style={{ fontSize: 12, color: 'rgba(148,163,184,0.6)' }}>{c.description}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="badge">{c.ad_type || 'general'}</span>
                  <span style={{ fontSize: 16, color: 'rgba(129,140,248,0.6)' }}>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function safeJson(str, fallback) {
  if (Array.isArray(str)) return str;
  try { return JSON.parse(str); } catch { return fallback; }
}
