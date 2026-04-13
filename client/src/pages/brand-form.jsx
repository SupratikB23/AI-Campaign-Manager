import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

const EMPTY = {
  name: '', website: '', fonts: '', colors: ['#6366f1', '#818cf8', '#ffffff'],
  tagline: '', brand_values: [''], aesthetic: '', tone: '', overview: '', logo_path: '',
};

export default function BrandForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const isEdit = Boolean(id);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/brands/${id}`)
      .then(r => r.json())
      .then(res => {
        const b = res.data;
        setForm({
          name: b.name || '',
          website: b.website || '',
          fonts: b.fonts || '',
          colors: safeJson(b.colors, ['#6366f1']),
          tagline: b.tagline || '',
          brand_values: safeJson(b.brand_values, ['']),
          aesthetic: b.aesthetic || '',
          tone: b.tone || '',
          overview: b.overview || '',
          logo_path: b.logo_path || '',
        });
      });
  }, [id]);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }
  function setColor(i, v) { const c = [...form.colors]; c[i] = v; set('colors', c); }
  function addColor() { if (form.colors.length < 6) set('colors', [...form.colors, '#cccccc']); }
  function removeColor(i) { if (form.colors.length > 1) set('colors', form.colors.filter((_, idx) => idx !== i)); }
  function setValue(i, v) { const vals = [...form.brand_values]; vals[i] = v; set('brand_values', vals); }
  function addValue() { set('brand_values', [...form.brand_values, '']); }
  function removeValue(i) { if (form.brand_values.length > 1) set('brand_values', form.brand_values.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const body = {
      ...form,
      brand_values: form.brand_values.filter(v => v.trim()),
      colors: form.colors.filter(c => c.trim()),
    };
    try {
      const res = await fetch(isEdit ? `/api/brands/${id}` : '/api/brands', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      navigate(`/brands/${data.data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleScrape() {
    const cleaned = (scrapeUrl || '').trim();
    if (!cleaned) {
      setError("Please enter a website URL to scrape.");
      return;
    }
    setScraping(true);
    setError('');
    setSuccessMsg('');
    try {
      const parsedUrl = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
      const res = await fetch('/api/brands/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: parsedUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const scraped = data.data;
      setForm(prev => ({
        ...prev,
        name: scraped.name || prev.name,
        website: scraped.website || prev.website,
        fonts: scraped.fonts || prev.fonts,
        colors: (scraped.colors && scraped.colors.length) ? scraped.colors : prev.colors,
        tagline: scraped.tagline || prev.tagline,
        brand_values: (scraped.brand_values && scraped.brand_values.length) ? scraped.brand_values : prev.brand_values,
        aesthetic: scraped.aesthetic || prev.aesthetic,
        tone: scraped.tone || prev.tone,
        overview: scraped.overview || prev.overview,
        logo_path: scraped.logo_path || prev.logo_path,
      }));
      setSuccessMsg(
        scraped.logo_path
          ? "Brand data & logo successfully extracted!"
          : "Brand data auto-filled (logo could not be detected — you can add one manually)."
      );
    } catch (err) {
      setError(err.message || "Failed to scrape relative brand. Try manually.");
    } finally {
      setScraping(false);
    }
  }

  const sectionStyle = {
    marginBottom: 28,
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <Link to={isEdit ? `/brands/${id}` : '/'} style={{ textDecoration: 'none' }}>
        <span style={{ fontSize: 13, color: 'rgba(129,140,248,0.8)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24 }}>
          ← {isEdit ? 'Back to brand' : 'All Brands'}
        </span>
      </Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px', marginBottom: 4 }}>
        {isEdit ? 'Edit Brand DNA' : 'Create Brand DNA'}
      </h1>
      <p style={{ fontSize: 14, color: 'rgba(148,163,184,0.7)', marginBottom: 32 }}>
        Define your brand's identity, aesthetics, and tone for AI-powered ad generation.
      </p>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          color: '#fca5a5', fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
          borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          color: '#86efac', fontSize: 14,
        }}>
          {successMsg}
        </div>
      )}

      {/* Scrape Auto-fill Section */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24, background: 'linear-gradient(145deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))', border: '1px solid rgba(99,102,241,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚡️</span> Auto-fill with AI
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.9)', marginBottom: 16 }}>
          Enter the brand's website URL and we'll use Gemini Vision to automatically extract their visual aesthetic, typography, colors, and core values.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="url"
            value={scrapeUrl}
            onChange={e => setScrapeUrl(e.target.value)}
            placeholder="https://example.com"
            className="glass-input"
            style={{ flex: 1 }}
            disabled={scraping}
          />
          <button
            type="button"
            onClick={handleScrape}
            disabled={scraping || !scrapeUrl}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: 'white', border: 'none', borderRadius: 10, padding: '0 24px',
              cursor: scraping || !scrapeUrl ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14,
              opacity: scraping || !scrapeUrl ? 0.6 : 1, transition: 'all 0.2s'
            }}
          >
            {scraping ? 'Analyzing...' : 'Auto-fill'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Identity Section */}
        <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.7)', marginBottom: 20 }}>
            ✦ Brand Identity
          </div>

          {/* Logo preview */}
          {form.logo_path && (
            <div style={{ marginBottom: 20 }}>
              <label className="label">Brand Logo</label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: 16,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
              }}>
                <div style={{
                  width: 88, height: 88, borderRadius: 10,
                  background: 'rgba(255,255,255,0.95)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 8, flexShrink: 0,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}>
                  <img
                    src={`/static/generated/${form.logo_path}`}
                    alt="Brand logo"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>
                    Logo extracted automatically
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', wordBreak: 'break-all' }}>
                    {form.logo_path}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => set('logo_path', '')}
                  className="btn-danger"
                  style={{ padding: '6px 12px', fontSize: 12, flexShrink: 0 }}
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          <div style={sectionStyle}>
            <GlassField label="Brand Name *" value={form.name} onChange={v => set('name', v)} placeholder="e.g. Acme Corp" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <GlassField label="Website URL" value={form.website} onChange={v => set('website', v)} type="url" placeholder="https://..." />
            <GlassField label="Fonts" value={form.fonts} onChange={v => set('fonts', v)} placeholder="Inter, Playfair Display" />
          </div>
          <GlassField label="Tagline" value={form.tagline} onChange={v => set('tagline', v)} placeholder="Short, memorable tagline..." />
        </div>

        {/* Colors Section */}
        <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.7)', marginBottom: 20 }}>
            ✦ Color Palette *
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            {form.colors.map((c, i) => (
              <div key={i} style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '10px 12px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <input
                  type="color"
                  value={c}
                  onChange={e => setColor(i, e.target.value)}
                  style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 2, background: 'transparent' }}
                />
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.6)', marginBottom: 2 }}>Color {i + 1}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.05em' }}>{c.toUpperCase()}</div>
                </div>
                {form.colors.length > 1 && (
                  <button type="button" onClick={() => removeColor(i)} style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: 4,
                    color: '#fca5a5', cursor: 'pointer', fontSize: 10, padding: '1px 5px',
                  }}>✕</button>
                )}
              </div>
            ))}
            {form.colors.length < 6 && (
              <button type="button" onClick={addColor} style={{
                background: 'rgba(129,140,248,0.1)', border: '1px dashed rgba(129,140,248,0.3)',
                borderRadius: 12, padding: '10px 16px', color: '#818cf8',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
              }}>+ Add Color</button>
            )}
          </div>
        </div>

        {/* Brand Values */}
        <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.7)', marginBottom: 20 }}>
            ✦ Brand Values *
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.brand_values.map((v, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <input
                  className="glass-input"
                  value={v}
                  onChange={e => setValue(i, e.target.value)}
                  placeholder="e.g. ROI-focused, transparent, data-driven..."
                  style={{ flex: 1 }}
                />
                {form.brand_values.length > 1 && (
                  <button type="button" onClick={() => removeValue(i)} className="btn-danger" style={{ padding: '8px 12px', flexShrink: 0 }}>✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addValue} style={{
              background: 'transparent', border: '1px dashed rgba(129,140,248,0.3)',
              borderRadius: 10, padding: '8px', color: '#818cf8',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}>+ Add Value</button>
          </div>
        </div>

        {/* Voice & Aesthetic */}
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(129,140,248,0.7)', marginBottom: 20 }}>
            ✦ Voice & Aesthetic
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <GlassTextArea label="Aesthetic Description *" value={form.aesthetic} onChange={v => set('aesthetic', v)} placeholder="Describe the visual mood, style, and imagery preferences..." />
            <GlassTextArea label="Tone of Voice *" value={form.tone} onChange={v => set('tone', v)} placeholder="How the brand communicates — formal, playful, direct, warm..." />
            <GlassTextArea label="Business Overview *" value={form.overview} onChange={v => set('overview', v)} placeholder="What the brand does, who it serves, what makes it unique..." />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '12px 28px', fontSize: 15 }}>
            {saving ? 'Saving...' : (isEdit ? 'Update Brand' : 'Create Brand DNA')}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost" style={{ padding: '12px 28px', fontSize: 15 }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function GlassField({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="glass-input"
      />
    </div>
  );
}

function GlassTextArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="label">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="glass-input"
        style={{ resize: 'vertical', lineHeight: 1.6 }}
      />
    </div>
  );
}

function safeJson(str, fallback) {
  if (Array.isArray(str)) return str;
  try { return JSON.parse(str); } catch { return fallback; }
}
