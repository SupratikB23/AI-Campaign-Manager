import { Router } from 'express';
import db from '../db/index.js';
import { scrapeBrandData } from '../services/scraper.js';

const router = Router();

// Scrape brand data from a URL using Gemini + Playwright
router.post('/scrape', async (req, res) => {
  let { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required for scraping' });

  url = String(url).trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  try {
    new URL(url); // validate
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    const data = await scrapeBrandData(url);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Scraping failed: ' + err.message });
  }
});


// List all brands
router.get('/', (req, res) => {
  const brands = db.prepare('SELECT * FROM brands ORDER BY created_at DESC').all();
  res.json({ data: brands });
});

// Get single brand
router.get('/:id', (req, res) => {
  const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);
  if (!brand) return res.status(404).json({ error: 'Brand not found' });
  res.json({ data: brand });
});

// Create brand
router.post('/', (req, res) => {
  const { name, website, fonts, colors, tagline, brand_values, aesthetic, tone, overview, logo_path } = req.body;

  if (!name || !colors || !brand_values || !aesthetic || !tone || !overview) {
    return res.status(400).json({ error: 'Missing required fields: name, colors, brand_values, aesthetic, tone, overview' });
  }

  const result = db.prepare(`
    INSERT INTO brands (name, website, fonts, colors, tagline, brand_values, aesthetic, tone, overview, logo_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    website || null,
    fonts || null,
    JSON.stringify(colors),
    tagline || null,
    JSON.stringify(brand_values),
    aesthetic,
    tone,
    overview,
    logo_path || null
  );

  const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ data: brand });
});

// Update brand
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Brand not found' });

  const { name, website, fonts, colors, tagline, brand_values, aesthetic, tone, overview, logo_path } = req.body;

  db.prepare(`
    UPDATE brands SET name = ?, website = ?, fonts = ?, colors = ?, tagline = ?,
    brand_values = ?, aesthetic = ?, tone = ?, overview = ?, logo_path = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name || existing.name,
    website ?? existing.website,
    fonts ?? existing.fonts,
    colors ? JSON.stringify(colors) : existing.colors,
    tagline ?? existing.tagline,
    brand_values ? JSON.stringify(brand_values) : existing.brand_values,
    aesthetic || existing.aesthetic,
    tone || existing.tone,
    overview || existing.overview,
    logo_path ?? existing.logo_path,
    req.params.id
  );

  const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);
  res.json({ data: brand });
});

// Delete brand
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Brand not found' });

  db.prepare('DELETE FROM brands WHERE id = ?').run(req.params.id);
  res.json({ data: { message: 'Brand deleted' } });
});

export default router;
