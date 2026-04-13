import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import BrandList from './pages/brand-list.jsx';
import BrandForm from './pages/brand-form.jsx';
import BrandDetail from './pages/brand-detail.jsx';
import CampaignPage from './pages/campaign-page.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh' }}>
        {/* Navbar */}
        <nav style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(10, 10, 26, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '60px',
        }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, boxShadow: '0 0 16px rgba(99,102,241,0.5)',
            }}>✦</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9', letterSpacing: '-0.3px' }}>
              Campaign Manager
            </span>
          </Link>
          <Link to="/brands/new">
            <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 13 }}>
              + New Brand
            </button>
          </Link>
        </nav>

        {/* Main content */}
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
          <Routes>
            <Route path="/" element={<BrandList />} />
            <Route path="/brands/new" element={<BrandForm />} />
            <Route path="/brands/:id/edit" element={<BrandForm />} />
            <Route path="/brands/:id" element={<BrandDetail />} />
            <Route path="/campaigns/:id" element={<CampaignPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
