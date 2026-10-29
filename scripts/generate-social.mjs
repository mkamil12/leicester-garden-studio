/**
 * Regenerate the website's 1200×630 social-sharing JPEGs.
 * Uses local `sharp` when installed. For authoring environments with bundled
 * dependencies, set SHARP_MODULE_PATH to that package directory.
 * No network calls; no image generation; no application configuration changes.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); }
catch (error) {
  if (!process.env.SHARP_MODULE_PATH) {
    throw new Error('Install sharp locally, or set SHARP_MODULE_PATH to an existing authoring-runtime package directory.', { cause: error });
  }
  sharp = require(process.env.SHARP_MODULE_PATH);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'public', 'social');
const assets = path.join(root, 'public', 'assets');
const width = 1200;
const height = 630;
const cards = [
  { slug: 'home', title: 'Naturally well kept.', image: 'garden-hero-v2.jpg', section: 'GARDEN & GROUNDS CARE' },
  { slug: 'services', title: 'Garden care, made personal.', image: 'garden-detail-v2.jpg', section: 'THE SERVICES' },
  { slug: 'regular-maintenance', title: 'Regular garden maintenance.', image: 'mma/garden-after.jpg', section: 'REGULAR MAINTENANCE' },
  { slug: 'one-off-care', title: 'Garden clearance.', image: 'mma/tidy-after.jpg', section: 'ONE-OFF CARE' },
  { slug: 'lawn-treatment', title: 'Hedges, trees & lawns.', image: 'mma/hedge-after.jpg', section: 'GARDEN CARE' },
  { slug: 'about', title: 'Meet MMA Garden Services.', image: 'garden-hero-v2.jpg', section: 'OUR APPROACH' },
  { slug: 'pricing', title: 'A quote shaped around your garden.', image: 'garden-detail-v2.jpg', section: 'PRICING & QUOTES' },
  { slug: 'booking', title: 'Your next garden visit.', image: 'garden-hero-v2.jpg', section: 'REQUEST A VISIT' },
  { slug: 'contact', title: 'Let’s talk about your garden.', image: 'mma/rear-after.jpg', section: 'GET IN TOUCH' },
  { slug: 'privacy', title: 'Your details, handled with care.', image: 'garden-detail-v2.jpg', section: 'PRIVACY' },
  { slug: 'proposal', title: 'A new chapter for MMA.', image: 'garden-hero-v2.jpg', section: 'THE WEBSITE PROPOSAL' },
  { slug: 'projects', title: 'Real gardens. Remarkable changes.', image: 'mma/garden-after.jpg', section: 'BEFORE & AFTER' },
];
const escape = text => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
function wrap(text, max = 24) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > max) { lines.push(line); line = word; }
    else line += (line ? ' ' : '') + word;
  }
  if (line) lines.push(line);
  return lines;
}
await mkdir(destination, { recursive: true });
const logo = await sharp(path.join(assets, 'mma', 'logo-transparent.png')).resize({ width: 128, height: 128, fit: 'inside' }).png().toBuffer();
const manifest = [];
for (const card of cards) {
  const lines = wrap(card.title);
  const fontSize = lines.length > 2 ? 70 : 78;
  const leading = 86;
  const titleY = lines.length > 2 ? 258 : 286;
  const overlay = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#102314" stop-opacity=".94"/><stop offset=".58" stop-color="#102314" stop-opacity=".78"/><stop offset="1" stop-color="#102314" stop-opacity=".32"/></linearGradient>
      <linearGradient id="bottom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#08150b" stop-opacity="0"/><stop offset="1" stop-color="#08150b" stop-opacity=".72"/></linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#shade)"/>
    <rect y="330" width="1200" height="300" fill="url(#bottom)"/>
    <g fill="#f3f5ec" font-family="Arial, Helvetica, sans-serif">
      <text x="60" y="80" font-size="30" font-weight="700" letter-spacing="1.2">MMA GARDEN SERVICES</text>
      <text x="61" y="151" font-size="13" letter-spacing="3" fill="#c2d3b4">${escape(card.section)}</text>
      ${lines.map((line, i) => `<text x="55" y="${titleY + i * leading}" font-size="${fontSize}" font-weight="400" letter-spacing="-3">${escape(line)}</text>`).join('')}
      <text x="61" y="575" font-size="14" letter-spacing="2.6">WEBSITE PREVIEW</text>
      <text x="1138" y="575" font-size="12" text-anchor="end" letter-spacing="1.8" fill="#d0dbc6">LEICESTER &amp; LEICESTERSHIRE</text>
    </g>
    <path d="M60 526H1140" stroke="#d7e5c6" stroke-opacity=".25"/>
  </svg>`);
  const composition = await sharp(path.join(assets, card.image))
    .rotate()
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .composite([{ input: overlay }, { input: logo, left: 1012, top: 28 }])
    .toBuffer();
  let quality = 84;
  let jpeg = await sharp(composition).jpeg({ quality, mozjpeg: true }).toBuffer();
  while (jpeg.length > 250_000 && quality > 60) {
    quality -= 4;
    jpeg = await sharp(composition).jpeg({ quality, mozjpeg: true }).toBuffer();
  }
  const filename = `${card.slug}.jpg`;
  await writeFile(path.join(destination, filename), jpeg);
  manifest.push({ filename, title: card.title, width, height, bytes: jpeg.length, background: `/assets/${card.image}`, logo: '/assets/mma/logo-transparent.png', preview: true });
  console.log(`${filename}: ${Math.round(jpeg.length / 1024)} KB`);
}
await writeFile(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
