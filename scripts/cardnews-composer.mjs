import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';

const WIDTH = 1080;
const HEIGHT = 1350;
const TOP_BAR_H = 120;
const BOTTOM_BAR_H = 100;
const IMAGE_H = HEIGHT - TOP_BAR_H - BOTTOM_BAR_H; // 1130

const LOGO_PATH = join(import.meta.dirname, '..', 'assets', 'dokbak-logo.jpg');

function makeSvgOverlay(topText, bottomText) {
  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <!-- Top bar -->
  <rect x="0" y="0" width="${WIDTH}" height="${TOP_BAR_H}" fill="#8B7355"/>
  <text x="${WIDTH/2}" y="${TOP_BAR_H/2 + 18}" font-family="AppleSDGothicNeo-Bold, Apple SD Gothic Neo, sans-serif" font-size="52" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escXml(topText)}</text>
  
  <!-- Bottom bar -->
  <rect x="0" y="${HEIGHT - BOTTOM_BAR_H}" width="${WIDTH}" height="${BOTTOM_BAR_H}" fill="#000000"/>
  <text x="${WIDTH/2 - 30}" y="${HEIGHT - BOTTOM_BAR_H/2 + 14}" font-family="AppleSDGothicNeo-Bold, Apple SD Gothic Neo, sans-serif" font-size="38" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${escXml(bottomText)}</text>
</svg>`;
}

function escXml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export async function compose(bgPath, topText, bottomText, outPath) {
  const bg = await sharp(bgPath)
    .resize(WIDTH, IMAGE_H, { fit: 'cover' })
    .toBuffer();

  const svg = Buffer.from(makeSvgOverlay(topText, bottomText));

  // Prepare logo for bottom-right corner
  const logo = await sharp(LOGO_PATH)
    .resize(70, 38, { fit: 'inside' })
    .toBuffer();

  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    }
  })
    .composite([
      { input: bg, top: TOP_BAR_H, left: 0 },
      { input: svg, top: 0, left: 0 },
      { input: logo, top: HEIGHT - BOTTOM_BAR_H + Math.floor((BOTTOM_BAR_H - 38) / 2), left: WIDTH - 70 - 15 }
    ])
    .png()
    .toFile(outPath);

  console.log(`✅ ${outPath}`);
}

// CLI usage: node cardnews-composer.mjs <bgPath> <topText> <bottomText> <outPath>
if (process.argv[1]?.endsWith('cardnews-composer.mjs') && process.argv.length >= 6) {
  const [,, bgPath, topText, bottomText, outPath] = process.argv;
  compose(bgPath, topText, bottomText, outPath).catch(console.error);
}
