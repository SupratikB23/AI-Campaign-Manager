import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import slugify from 'slugify';
import db from '../db/index.js';
import { buildPrompt } from '../services/prompt-builder.js';
import { generateImage } from '../services/huggingface.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.join(__dirname, '..', '..', 'generated');

const router = Router();

// Generate an image
router.post('/campaigns/:campaignId/generate', async (req, res) => {
  try {
    const campaign = db.prepare(`
      SELECT c.*, b.name as brand_name, b.colors, b.aesthetic, b.tone,
             b.brand_values, b.overview, b.tagline, b.fonts, b.website
      FROM campaigns c
      JOIN brands b ON b.id = c.brand_id
      WHERE c.id = ?
    `).get(req.params.campaignId);

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const { brief, customPrompt } = req.body;

    const brand = {
      name: campaign.brand_name,
      colors: campaign.colors,
      aesthetic: campaign.aesthetic,
      tone: campaign.tone,
      brand_values: campaign.brand_values,
      overview: campaign.overview,
      tagline: campaign.tagline,
    };

    const prompt = customPrompt || buildPrompt({ brand, campaign, brief });

    const imageBuffer = await generateImage(prompt);

    // Save to disk
    const brandSlug = slugify(campaign.brand_name, { lower: true, strict: true });
    const campaignSlug = slugify(campaign.name, { lower: true, strict: true });
    const dir = path.join(generatedDir, brandSlug, campaignSlug);
    fs.mkdirSync(dir, { recursive: true });

    const timestamp = Date.now();
    const filename = `${timestamp}.png`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, imageBuffer);

    const relativePath = `${brandSlug}/${campaignSlug}/${filename}`;

    // Save to DB
    const result = db.prepare(
      'INSERT INTO generations (campaign_id, prompt, image_path) VALUES (?, ?, ?)'
    ).run(req.params.campaignId, prompt, relativePath);

    const generation = db.prepare('SELECT * FROM generations WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      data: {
        ...generation,
        imageUrl: `/static/generated/${relativePath}`,
      },
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

// List images for a campaign
router.get('/campaigns/:campaignId/images', (req, res) => {
  const images = db.prepare(
    'SELECT * FROM generations WHERE campaign_id = ? ORDER BY created_at DESC'
  ).all(req.params.campaignId);

  const data = images.map(img => ({
    ...img,
    imageUrl: `/static/generated/${img.image_path}`,
  }));

  res.json({ data });
});

// Delete an image
router.delete('/images/:id', (req, res) => {
  const image = db.prepare('SELECT * FROM generations WHERE id = ?').get(req.params.id);
  if (!image) return res.status(404).json({ error: 'Image not found' });

  // Delete file from disk
  const filePath = path.join(generatedDir, image.image_path);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  db.prepare('DELETE FROM generations WHERE id = ?').run(req.params.id);
  res.json({ data: { message: 'Image deleted' } });
});

export default router;
