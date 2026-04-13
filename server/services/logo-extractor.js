import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGOS_DIR = path.join(__dirname, '..', '..', 'generated', 'logos');

// Ensure logos directory exists
function ensureLogosDir() {
  if (!fs.existsSync(LOGOS_DIR)) {
    fs.mkdirSync(LOGOS_DIR, { recursive: true });
  }
}

// --- TIER 1: DOM / HTML extraction ---
// Runs inside the existing Playwright page. Returns a URL string or null.
export async function extractLogoUrlFromDOM(page) {
  return await page.evaluate(() => {
    const absolutize = (href) => {
      if (!href) return null;
      try {
        return new URL(href, document.baseURI).href;
      } catch {
        return null;
      }
    };

    // 1. Schema.org Organization logo (highest confidence)
    const ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of ldScripts) {
      try {
        const parsed = JSON.parse(script.textContent);
        const entries = Array.isArray(parsed) ? parsed : [parsed];
        for (const entry of entries) {
          if (!entry) continue;
          const logo = entry.logo || (entry.publisher && entry.publisher.logo);
          if (typeof logo === 'string') return { url: absolutize(logo), source: 'schema.org' };
          if (logo && typeof logo === 'object' && logo.url) return { url: absolutize(logo.url), source: 'schema.org' };
        }
      } catch {}
    }

    // 2. Apple touch icon (typically 180x180 high-res)
    const apple = document.querySelector('link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]');
    if (apple && apple.href) return { url: absolutize(apple.href), source: 'apple-touch-icon' };

    // 3. og:logo explicit meta
    const ogLogo = document.querySelector('meta[property="og:logo"]');
    if (ogLogo && ogLogo.content) return { url: absolutize(ogLogo.content), source: 'og:logo' };

    // 4. <img> elements in header/nav with "logo" in class/id/alt/src
    const imgSelectors = [
      'header img', 'nav img', '[class*="header" i] img', '[class*="navbar" i] img',
      'img[class*="logo" i]', 'img[id*="logo" i]', 'img[alt*="logo" i]', 'img[src*="logo" i]',
      'a[class*="logo" i] img', 'a[class*="brand" i] img'
    ];
    for (const sel of imgSelectors) {
      const img = document.querySelector(sel);
      if (img && img.src) {
        const rect = img.getBoundingClientRect();
        // Skip 1x1 trackers / hidden images
        if (rect.width >= 20 && rect.height >= 20) {
          return { url: absolutize(img.src), source: 'dom-img' };
        }
      }
    }

    // 5. High-res favicon link (prefer larger sizes)
    const iconLinks = Array.from(document.querySelectorAll('link[rel~="icon"]'));
    let best = null;
    let bestSize = 0;
    for (const link of iconLinks) {
      if (!link.href) continue;
      const sizesAttr = link.getAttribute('sizes') || '';
      const size = parseInt(sizesAttr.split('x')[0], 10) || 0;
      if (!best || size > bestSize) {
        best = link;
        bestSize = size;
      }
    }
    if (best) return { url: absolutize(best.href), source: 'favicon-link' };

    return null;
  });
}

// Download a remote image URL to a buffer
async function downloadImage(url) {
  const res = await fetch(url, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    }
  });
  if (!res.ok) throw new Error(`Failed to download logo: HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Convert any image buffer to PNG and validate it has real content
async function normalizeToPng(buffer) {
  const image = sharp(buffer);
  const meta = await image.metadata();
  if (!meta.width || !meta.height || meta.width < 16 || meta.height < 16) {
    throw new Error(`Logo image too small: ${meta.width}x${meta.height}`);
  }
  return await image.png().toBuffer();
}

// Save a logo buffer to /generated/logos/ and return relative path
export function saveLogoBuffer(buffer, hostname) {
  ensureLogosDir();
  const safeHost = (hostname || 'logo').replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const filename = `${safeHost}-${Date.now()}.png`;
  const fullPath = path.join(LOGOS_DIR, filename);
  fs.writeFileSync(fullPath, buffer);
  // Return path relative to /generated (matches how generations use image_path)
  return path.posix.join('logos', filename);
}

// --- TIER 2: Gemini bounding box from screenshot ---
// Gemini returns normalized [ymin, xmin, ymax, xmax] on a 0-1000 scale.
// Converts that to pixel coords and crops the screenshot.
export async function cropLogoFromBbox(screenshotBuffer, bbox) {
  if (!Array.isArray(bbox) || bbox.length !== 4) return null;
  const [ymin, xmin, ymax, xmax] = bbox.map(Number);
  if ([ymin, xmin, ymax, xmax].some(v => Number.isNaN(v))) return null;
  if (ymax <= ymin || xmax <= xmin) return null;

  const meta = await sharp(screenshotBuffer).metadata();
  const W = meta.width;
  const H = meta.height;

  // Convert normalized 0-1000 → pixels and clamp
  const left = Math.max(0, Math.floor((xmin / 1000) * W));
  const top = Math.max(0, Math.floor((ymin / 1000) * H));
  const right = Math.min(W, Math.ceil((xmax / 1000) * W));
  const bottom = Math.min(H, Math.ceil((ymax / 1000) * H));

  const width = right - left;
  const height = bottom - top;
  if (width < 16 || height < 16) return null;

  return await sharp(screenshotBuffer)
    .extract({ left, top, width, height })
    .png()
    .toBuffer();
}

// --- TIER 3: HuggingFace OWL-ViT zero-shot detection fallback ---
export async function extractLogoFromHuggingFace(screenshotBuffer) {
  const token = process.env.HF_API_TOKEN;
  if (!token) throw new Error('HF_API_TOKEN not set');

  const endpoint = 'https://api-inference.huggingface.co/models/google/owlvit-base-patch32';
  const payload = {
    inputs: {
      image: screenshotBuffer.toString('base64')
    },
    parameters: {
      candidate_labels: ['company logo', 'brand logo', 'brand mark']
    }
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    timeout: 60000
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HF API error ${res.status}: ${errText.substring(0, 200)}`);
  }

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  // Pick highest-confidence detection
  const sorted = data
    .filter(d => d && d.box && typeof d.score === 'number')
    .sort((a, b) => b.score - a.score);

  if (sorted.length === 0 || sorted[0].score < 0.1) return null;

  const { xmin, ymin, xmax, ymax } = sorted[0].box;
  const meta = await sharp(screenshotBuffer).metadata();
  const left = Math.max(0, Math.floor(xmin));
  const top = Math.max(0, Math.floor(ymin));
  const right = Math.min(meta.width, Math.ceil(xmax));
  const bottom = Math.min(meta.height, Math.ceil(ymax));
  const width = right - left;
  const height = bottom - top;
  if (width < 16 || height < 16) return null;

  return await sharp(screenshotBuffer)
    .extract({ left, top, width, height })
    .png()
    .toBuffer();
}

// High-level orchestrator: tries URL → buffer pipeline
export async function downloadAndNormalizeLogo(url) {
  const raw = await downloadImage(url);
  return await normalizeToPng(raw);
}
