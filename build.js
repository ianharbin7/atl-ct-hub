// Draws the app icon (navy square, white jet) as PNG files. No libraries needed.
const fs = require('fs'), zlib = require('zlib');
function crc(buf) { let c, crc = 0xffffffff; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xffffffff) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); }
// jet outline in a 120x100 box (same shapes as the page logo), polygons only
const SHAPES = [
  [[6,50],[10,46.5],[20,44.5],[100,46],[118,50],[100,54],[20,55.5],[10,53.5]],
  [[54,46.5],[34,8],[46,8],[82,46]], [[54,53.5],[34,92],[46,92],[82,54]],
  [[18,45.5],[8,27],[16,27],[32,45.5]], [[18,54.5],[8,73],[16,73],[32,54.5]]
];
function inside(pt, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
function make(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const sc = size * 0.72 / 120, ox = (size - 120 * sc) / 2, oy = (size - 100 * sc) / 2;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size);                       // navy gradient
      let r = Math.round(0 + 12 * (1 - t)), g = Math.round(24 + 38 * (1 - t)), b = Math.round(48 + 70 * (1 - t));
      if (y > size * 0.9) { r = 200; g = 16; b = 46; }       // red stripe at the bottom
      let hit = 0;
      for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) {
        const p = [(x + (sx + .5) / 2 - ox) / sc, (y + (sy + .5) / 2 - oy) / sc];
        if (y <= size * 0.9 && SHAPES.some(s => inside(p, s))) hit++;
      }
      const a = hit / 4; r = Math.round(r + (255 - r) * a); g = Math.round(g + (255 - g) * a); b = Math.round(b + (255 - b) * a);
      const o = y * (size * 4 + 1) + 1 + x * 4; raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
fs.writeFileSync('icon-180.png', make(180));
fs.writeFileSync('icon-512.png', make(512));
console.log('icons written');
