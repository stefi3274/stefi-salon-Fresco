const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fond bleu
  ctx.fillStyle = '#2563EB';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.18);
  ctx.fill();

  // Cercle blanc central
  const cx = size / 2, cy = size / 2, r = size * 0.32;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Emoji 🧊 texte
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${size * 0.38}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧊', cx, cy - size * 0.05);

  // Texte bas
  ctx.font = `bold ${size * 0.11}px Arial`;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('SteFi', cx, cy + size * 0.32);

  return canvas.toBuffer('image/png');
}

const dir = path.join(__dirname, 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

fs.writeFileSync(path.join(dir, 'icon-192.png'), drawIcon(192));
fs.writeFileSync(path.join(dir, 'icon-512.png'), drawIcon(512));
console.log('Icônes générées ✅');
