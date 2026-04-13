const HF_MODEL_URL = 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell';
const MAX_RETRIES = 3;

/**
 * Generate an ad image using FLUX.1-schnell (text-to-image, free hf-inference).
 *
 * @param {string} prompt - Full text prompt built from Brand DNA.
 * @returns {Promise<Buffer>} - PNG image buffer.
 */
export async function generateImage(prompt) {
  const token = process.env.HF_API_TOKEN;
  if (!token) throw new Error('HF_API_TOKEN environment variable is not set');

  return callFlux(prompt, token);
}

// ── FLUX.1-schnell text-to-image ──────────────────────────────────────────────

async function callFlux(prompt, token) {
  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(HF_MODEL_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt }),
      });

      if (response.ok) {
        return Buffer.from(await response.arrayBuffer());
      }

      if (response.status === 429) {
        await sleep(Math.pow(2, attempt + 1) * 1000);
        lastError = new Error('Rate limited (429)');
        continue;
      }

      if (response.status === 503) {
        const body = await response.json().catch(() => ({}));
        const t = Math.ceil(body.estimated_time || 20);
        throw Object.assign(
          new Error(`Model is loading. Try again in ~${t}s.`),
          { status: 503 }
        );
      }

      const errorText = await response.text().catch(() => 'Unknown error');
      throw Object.assign(
        new Error(`HF API ${response.status}: ${errorText.substring(0, 300)}`),
        { status: response.status }
      );
    } catch (err) {
      if (err.status) throw err;
      lastError = err;
    }
  }

  throw lastError || new Error('Image generation failed after retries');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
