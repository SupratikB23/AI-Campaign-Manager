export function buildPrompt({ brand, campaign, brief }) {
  const colors = parseJson(brand.colors, []);
  const values = parseJson(brand.brand_values, []);
  const colorStr = colors.length > 0 ? colors.join(', ') : 'professional colors';
  const valuesStr = values.length > 0 ? values.join(', ') : '';

  const parts = [
    `A professional ${campaign.ad_type || 'digital'} advertisement for ${brand.name}.`,
  ];

  if (brief) {
    parts.push(brief);
  }

  parts.push(`Style: ${brand.aesthetic}.`);
  parts.push(`Color scheme: ${colorStr}.`);
  parts.push(`Mood and tone: ${brand.tone}.`);

  if (valuesStr) {
    parts.push(`Brand values: ${valuesStr}.`);
  }

  if (brand.tagline) {
    parts.push(`Tagline: "${brand.tagline}".`);
  }

  parts.push('High quality, professional advertising photography, clean composition, visually striking.');

  return parts.join(' ');
}

function parseJson(str, fallback) {
  if (Array.isArray(str)) return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
