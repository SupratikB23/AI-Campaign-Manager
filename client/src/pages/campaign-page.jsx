import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function CampaignPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [images, setImages] = useState([]);
  const [brief, setBrief] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    fetch(`/api/campaigns/${id}`).then(r => r.json()).then(r => setCampaign(r.data));
    loadImages();
  }, [id]);

  function loadImages() {
    fetch(`/api/campaigns/${id}/images`).then(r => r.json()).then(r => setImages(r.data || []));
  }

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const body = showPrompt && customPrompt.trim()
        ? { customPrompt }
        : { brief };
      const res = await fetch(`/api/campaigns/${id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function deleteImage(imageId) {
    if (!confirm('Delete this image?')) return;
    await fetch(`/api/images/${imageId}`, { method: 'DELETE' });
    loadImages();
  }

  if (!campaign) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(148,163,184,0.7)' }}>Loading...</div>
  );

  const canGenerate = !generating && (brief.trim() || (showPrompt && customPrompt.trim()));

  return (
    <div>
      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }}>
            <img src={lightbox.imageUrl} alt="Generated ad" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, boxShadow: '0 0 60px rgba(0,0,0,0.8)' }} />
            <button onClick={() => setLightbox(null)} style={{
              position: 'absolute', top: -14, right: -14, width: 28, height: 28,
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'center' }}>
              <a href={lightbox.imageUrl} download>
                <button className="btn-primary" style={{ fontSize: 13 }}>Download</button>
              </a>
              <button onClick={() => { deleteImage(lightbox.id); setLightbox(null); }} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}

      <Link to={`/brands/${campaign.brand_id}`} style={{ textDecoration: 'none' }}>
        <span style={{ fontSize: 13, color: 'rgba(129,140,248,0.8)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24 }}>
          ← {campaign.brand_name}
        </span>
      </Link>

      {/* Campaign Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.4px' }}>
            {campaign.name}
          </h1>
          <span className="badge">{campaign.ad_type || 'general'}</span>
        </div>
        {campaign.description && (
          <p style={{ fontSize: 14, color: 'rgba(148,163,184,0.7)' }}>{campaign.description}</p>
        )}
      </div>

      {/* Generation Panel */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 32, borderColor: 'rgba(129,140,248,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, boxShadow: '0 0 12px rgba(99,102,241,0.4)',
          }}>✦</div>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9' }}>Generate Ad Image</h2>
        </div>

        <label className="label">Ad Brief</label>
        <textarea
          value={brief}
          onChange={e => setBrief(e.target.value)}
          placeholder="Describe what the ad should show... e.g. 'A sleek product shot of a fitness tracker on marble with morning light, emphasizing precision and performance'"
          rows={3}
          className="glass-input"
          style={{ resize: 'vertical', lineHeight: 1.6, marginBottom: 14 }}
          disabled={showPrompt && customPrompt.trim()}
        />

        {/* Toggle custom prompt */}
        <button
          type="button"
          onClick={() => setShowPrompt(!showPrompt)}
          style={{
            background: 'transparent', border: 'none',
            color: 'rgba(129,140,248,0.8)', fontSize: 13,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 14, padding: 0, fontFamily: 'Inter, sans-serif',
          }}
        >
          <span style={{ fontSize: 10 }}>{showPrompt ? '▲' : '▼'}</span>
          {showPrompt ? 'Hide custom prompt' : 'Edit full prompt manually'}
        </button>

        {showPrompt && (
          <div style={{ marginBottom: 14 }}>
            <label className="label">Custom Prompt (overrides brief)</label>
            <textarea
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder="Write your full prompt here. This overrides the auto-generated prompt from your Brand DNA..."
              rows={5}
              className="glass-input"
              style={{ resize: 'vertical', lineHeight: 1.6, fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 14,
            color: '#fca5a5', fontSize: 13,
          }}>
            ⚠ {error}
          </div>
        )}

        <button onClick={handleGenerate} disabled={!canGenerate} className="btn-primary" style={{ padding: '12px 28px', fontSize: 15 }}>
          {generating ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>◌</span>
              Generating... (10–30s)
            </span>
          ) : '✦ Generate Image'}
        </button>
      </div>

      {/* Gallery */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>Generated Images</h2>
        <span style={{ fontSize: 13, color: 'rgba(148,163,184,0.5)' }}>{images.length} image{images.length !== 1 ? 's' : ''}</span>
      </div>

      {images.length === 0 ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🖼</div>
          <p style={{ color: 'rgba(148,163,184,0.5)', fontSize: 14 }}>
            No images yet. Write a brief and generate your first ad image.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {images.map(img => (
            <div key={img.id} className="glass-card" style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => setLightbox(img)}>
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <img
                  src={img.imageUrl}
                  alt="Generated ad"
                  style={{ width: '100%', display: 'block', transition: 'transform 0.3s ease' }}
                  onMouseEnter={e => e.target.style.transform = 'scale(1.03)'}
                  onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
                  opacity: 0, transition: 'opacity 0.2s',
                  display: 'flex', alignItems: 'flex-end', padding: 12,
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                >
                  <span style={{ color: '#fff', fontSize: 12 }}>Click to expand</span>
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <p style={{
                  fontSize: 11, color: 'rgba(148,163,184,0.6)', marginBottom: 8, lineHeight: 1.5,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }} title={img.prompt}>{img.prompt}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'rgba(148,163,184,0.4)' }}>
                    {new Date(img.created_at).toLocaleDateString()} {new Date(img.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div style={{ display: 'flex', gap: 10 }} onClick={e => e.stopPropagation()}>
                    <a href={img.imageUrl} download style={{ fontSize: 12, color: '#818cf8', textDecoration: 'none' }}>Download</a>
                    <button onClick={() => deleteImage(img.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 12, color: 'rgba(239,68,68,0.7)', fontFamily: 'Inter, sans-serif',
                    }}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
