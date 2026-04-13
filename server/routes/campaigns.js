import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// List campaigns for a brand
router.get('/brands/:brandId/campaigns', (req, res) => {
  const campaigns = db.prepare(
    'SELECT * FROM campaigns WHERE brand_id = ? ORDER BY created_at DESC'
  ).all(req.params.brandId);
  res.json({ data: campaigns });
});

// Get single campaign with brand data
router.get('/campaigns/:id', (req, res) => {
  const campaign = db.prepare(`
    SELECT c.*, b.name as brand_name, b.colors, b.aesthetic, b.tone, b.brand_values, b.overview, b.tagline, b.fonts, b.website
    FROM campaigns c
    JOIN brands b ON b.id = c.brand_id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.json({ data: campaign });
});

// Create campaign
router.post('/brands/:brandId/campaigns', (req, res) => {
  const brand = db.prepare('SELECT id FROM brands WHERE id = ?').get(req.params.brandId);
  if (!brand) return res.status(404).json({ error: 'Brand not found' });

  const { name, description, ad_type } = req.body;
  if (!name) return res.status(400).json({ error: 'Campaign name is required' });

  const result = db.prepare(
    'INSERT INTO campaigns (brand_id, name, description, ad_type) VALUES (?, ?, ?, ?)'
  ).run(req.params.brandId, name, description || null, ad_type || null);

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ data: campaign });
});

// Update campaign
router.put('/campaigns/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Campaign not found' });

  const { name, description, ad_type } = req.body;

  db.prepare(`
    UPDATE campaigns SET name = ?, description = ?, ad_type = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name || existing.name,
    description ?? existing.description,
    ad_type ?? existing.ad_type,
    req.params.id
  );

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  res.json({ data: campaign });
});

// Delete campaign
router.delete('/campaigns/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Campaign not found' });

  db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
  res.json({ data: { message: 'Campaign deleted' } });
});

export default router;
