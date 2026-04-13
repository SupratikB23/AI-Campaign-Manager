import { chromium } from 'playwright';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  extractLogoUrlFromDOM,
  downloadAndNormalizeLogo,
  cropLogoFromBbox,
  extractLogoFromHuggingFace,
  saveLogoBuffer
} from './logo-extractor.js';

export async function scrapeBrandData(url) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });

    const fonts = await page.evaluate(() => {
      const fonts = new Set();
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        const font = window.getComputedStyle(el).fontFamily;
        if (font) font.split(',').forEach(f => fonts.add(f.replace(/['"]/g, '').trim()));
      }
      return Array.from(fonts).slice(0, 5);
    });

    let page_text = await page.evaluate("() => document.body ? document.body.innerText : ''");
    page_text = (page_text || "").substring(0, 15000);

    // --- TIER 1: Extract logo URL from DOM while browser is still open ---
    let logoDomResult = null;
    try {
      logoDomResult = await extractLogoUrlFromDOM(page);
    } catch (e) {
      console.warn('[logo] DOM extraction failed:', e.message);
    }

    // Viewport screenshot (used for both Gemini brand-DNA and logo bbox cropping).
    // Using viewport-only (not fullPage) so Gemini coordinates map cleanly to pixels.
    const screenshotBuffer = await page.screenshot({ fullPage: false, type: "png" });
    const b64_screenshot = screenshotBuffer.toString('base64');

    await browser.close();

    // Derive hostname for file naming
    let hostname = 'logo';
    try { hostname = new URL(url).hostname.replace(/^www\./, ''); } catch {}

    // Try downloading the DOM-extracted logo URL first
    let logoPath = null;
    if (logoDomResult && logoDomResult.url) {
      try {
        const buf = await downloadAndNormalizeLogo(logoDomResult.url);
        logoPath = saveLogoBuffer(buf, hostname);
        console.log(`[logo] Saved via ${logoDomResult.source}: ${logoPath}`);
      } catch (e) {
        console.warn(`[logo] Download from ${logoDomResult.source} failed:`, e.message);
      }
    }

    // --- Gemini call: brand DNA + (if needed) logo bounding box ---
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_API_KEY is not defined in the backend environment.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert brand strategist. I am giving you a screenshot of a company's website and all of the textual content extracted from the homepage.

Website Text Content:
${page_text.substring(0, 10000)}


Analyze the text and screenshot and accurately extract the following details about the brand. Return JSON output perfectly matching this schema exactly without markdown codeblocks. Do not include \`\`\`json or \`\`\` wrappers.
{
  "name": "string, full company or brand name",
  "tagline": "string, their primary slogan or value proposition",
  "brand_values": ["string", "string"],
  "aesthetic": "string, visual feel. Examples: Modern, Sleek, Tech-Centric, Playful, Corporate",
  "tone": "string, their communication style. Examples: Direct, Authoritative, Casual, Friendly",
  "overview": "string, a concise 2-3 sentence summary of what the company does and who they serve",
  "colors": ["#hex", "#hex"],
  "logo_bbox": [ymin, xmin, ymax, xmax]
}

For "colors": extract the 3-5 most visually dominant colors from the screenshot as strict hex codes.
For "logo_bbox": locate the company's primary brand logo in the screenshot (usually in the top header, often top-left). Return its bounding box as normalized coordinates in the range 0 to 1000 using the format [ymin, xmin, ymax, xmax]. If no distinct logo image is visible, return null for this field.`;

    const imagePart = {
      inlineData: {
        data: b64_screenshot,
        mimeType: "image/png"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    let text = result.response.text().trim();
    if (text.startsWith("```json")) text = text.substring(7);
    if (text.startsWith("```")) text = text.substring(3);
    if (text.endsWith("```")) text = text.substring(0, text.length - 3);

    const parsed = JSON.parse(text.trim());
    const logoBbox = parsed.logo_bbox;
    delete parsed.logo_bbox;

    // --- TIER 2: If DOM tier failed, crop logo from Gemini bbox ---
    if (!logoPath && Array.isArray(logoBbox)) {
      try {
        const cropped = await cropLogoFromBbox(screenshotBuffer, logoBbox);
        if (cropped) {
          logoPath = saveLogoBuffer(cropped, hostname);
          console.log(`[logo] Saved via Gemini bbox: ${logoPath}`);
        }
      } catch (e) {
        console.warn('[logo] Gemini bbox crop failed:', e.message);
      }
    }

    // --- TIER 3: HuggingFace OWL-ViT zero-shot detection fallback ---
    if (!logoPath) {
      try {
        const cropped = await extractLogoFromHuggingFace(screenshotBuffer);
        if (cropped) {
          logoPath = saveLogoBuffer(cropped, hostname);
          console.log(`[logo] Saved via HuggingFace OWL-ViT: ${logoPath}`);
        }
      } catch (e) {
        console.warn('[logo] HuggingFace fallback failed:', e.message);
      }
    }

    if (!logoPath) console.warn('[logo] All extraction tiers failed for', url);

    return {
      ...parsed,
      fonts: fonts.join(', '),
      website: url,
      logo_path: logoPath
    };
  } catch (err) {
    if (browser) await browser.close();
    throw err;
  }
}
