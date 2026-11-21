// The Poster for a Place That Isn't There
// Entry: a travel poster for VELMORA, a city of hanging gardens on
// floating terraces above a sea of clouds, reached only by glass
// balloon. There are no roads and no maps: the balloons leave at dawn.
// 100% code-drawn, no network, no external assets, fully deterministic
// (fixed data, no randomness). Writes /output/entry.png (1024x1024 PNG,
// <= 1 MiB).
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

// ---------------------------------------------------------------- canvas
const W = 1024;
const H = 1024;
const buf = new Uint8Array(W * H * 3);

type RGB = [number, number, number];
const C = {
  skyTop: [29, 58, 95] as RGB,
  skyMid: [196, 104, 90] as RGB,
  skyLow: [246, 176, 106] as RGB,
  sun: [247, 201, 72] as RGB,
  sunD: [232, 164, 48] as RGB,
  cream: [246, 239, 221] as RGB,
  cream2: [242, 227, 194] as RGB,
  cloud: [253, 246, 232] as RGB,
  cloudSh: [232, 214, 180] as RGB,
  ink: [31, 42, 63] as RGB,
  gold: [168, 132, 44] as RGB,
  goldD: [128, 98, 28] as RGB,
  grass: [74, 140, 84] as RGB,
  grassL: [110, 172, 96] as RGB,
  grassD: [46, 104, 62] as RGB,
  rock: [122, 82, 56] as RGB,
  rockD: [94, 60, 40] as RGB,
  rockL: [150, 108, 74] as RGB,
  leaf: [38, 112, 70] as RGB,
  leafL: [86, 164, 104] as RGB,
  trunk: [88, 58, 36] as RGB,
  water: [140, 200, 220] as RGB,
  waterL: [190, 228, 238] as RGB,
  white: [250, 248, 242] as RGB,
  red: [201, 79, 67] as RGB,
  teal: [32, 96, 110] as RGB,
};

function px(x: number, y: number, c: RGB): void {
  const xi = x | 0, yi = y | 0;
  if (xi < 0 || yi < 0 || xi >= W || yi >= H) return;
  const i = (yi * W + xi) * 3;
  buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
}
function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) px(i, j, c);
}
function hline(x: number, y: number, w: number, c: RGB): void {
  for (let i = 0; i < w; i++) px(x + i, y, c);
}
function vline(x: number, y: number, h: number, c: RGB): void {
  for (let j = 0; j < h; j++) px(x, y + j, c);
}
function line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  // round inputs: a fractional endpoint would never be hit exactly and
  // the Bresenham loop would run away across the canvas
  x0 = Math.round(x0); y0 = Math.round(y0);
  x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, x = x0, y = y0;
  for (let guard = 0; guard < 4000; guard++) {
    px(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}
function circle(cx: number, cy: number, r: number, c: RGB): void {
  for (let a = 0; a < 360; a += 1) {
    const t = (a * Math.PI) / 180;
    px(Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t)), c);
  }
}
function disc(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++)
      if (x * x + y * y <= r * r) px(cx + x, cy + y, c);
}
function ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB): void {
  for (let y = -ry; y <= ry; y++)
    for (let x = -rx; x <= rx; x++)
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) px(cx + x, cy + y, c);
}
function poly(points: Array<[number, number]>, c: RGB): void {
  let minY = 1e9, maxY = -1e9;
  for (const p of points) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  for (let y = Math.ceil(minY); y <= maxY; y++) {
    const xs: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.ceil(xs[k]); x <= xs[k + 1]; x++) px(x, y, c);
  }
}

// ---------------------------------------------------------------- 5x7 font
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "*": ["00000", "10101", "01110", "11111", "01110", "10101", "00000"],
};
function textW(s: string, sc: number): number {
  return s.length * 6 * sc - sc;
}
function drawText(x: number, y: number, s: string, sc: number, c: RGB): void {
  const up = s.toUpperCase();
  for (let ci = 0; ci < up.length; ci++) {
    const g = FONT[up[ci]] || FONT["?"];
    const ox = x + ci * 6 * sc;
    for (let r = 0; r < 7; r++)
      for (let col = 0; col < 5; col++)
        if (g[r][col] === "1") fillRect(ox + col * sc, y + r * sc, sc, sc, c);
  }
}
function textC(cx: number, y: number, s: string, sc: number, c: RGB): void {
  drawText(cx - Math.floor(textW(s, sc) / 2), y, s, sc, c);
}

// ---------------------------------------------------------------- PNG encode
const CRC_TABLE: Uint32Array = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(b: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(buf.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- scene bits
function tree(x: number, y: number, s: number): void {
  // y = ground line; s = canopy radius
  fillRect(x - 2, y - s, 4, s, C.trunk);
  disc(x, y - s - 4, s, C.leaf);
  disc(x - s / 2, y - s - 2, (s * 2) / 3, C.leafL);
  disc(x + s / 2, y - s - 2, (s * 2) / 3, C.leafL);
}
function bird(x: number, y: number, s: number): void {
  line(x - s, y, x, y - s / 2, C.ink);
  line(x, y - s / 2, x + s, y, C.ink);
}
function cloud(cx: number, cy: number, w: number, h: number, c: RGB): void {
  ellipse(cx, cy, w, h, c);
  ellipse(cx - w / 2, cy + h / 3, (w * 2) / 3, (h * 2) / 3, c);
  ellipse(cx + w / 2, cy + h / 3, (w * 2) / 3, (h * 2) / 3, c);
}
function island(x0: number, x1: number, topY: number, tipY: number, tipX: number): void {
  // grass cap
  fillRect(x0, topY, x1 - x0, 26, C.grass);
  fillRect(x0, topY, x1 - x0, 8, C.grassL);
  // rock underside tapering to a point
  poly([[x0, topY + 26], [x1, topY + 26], [tipX, tipY]], C.rock);
  poly([[x0 + 30, topY + 26], [x1 - 60, topY + 26], [tipX - 10, tipY - 14]], C.rockD);
  poly([[x0, topY + 26], [x0 + 90, topY + 26], [tipX + 24, tipY - 40]], C.rockL);
}
function waterfall(x: number, y0: number, y1: number, w: number): void {
  fillRect(x, y0, w, y1 - y0, C.water);
  fillRect(x + 3, y0, 3, y1 - y0, C.waterL);
  fillRect(x + w - 6, y0, 3, y1 - y0, C.waterL);
}

// ---------------------------------------------------------------- main draw
function draw(): void {
  // sunset sky: three-stop vertical gradient, scene ends at y=760
  for (let y = 0; y < 760; y++) {
    let c: RGB;
    if (y < 380) {
      const t = y / 380;
      c = [
        Math.round(C.skyTop[0] + (C.skyMid[0] - C.skyTop[0]) * t),
        Math.round(C.skyTop[1] + (C.skyMid[1] - C.skyTop[1]) * t),
        Math.round(C.skyTop[2] + (C.skyMid[2] - C.skyTop[2]) * t),
      ];
    } else {
      const t = (y - 380) / 380;
      c = [
        Math.round(C.skyMid[0] + (C.skyLow[0] - C.skyMid[0]) * t),
        Math.round(C.skyMid[1] + (C.skyLow[1] - C.skyMid[1]) * t),
        Math.round(C.skyMid[2] + (C.skyLow[2] - C.skyMid[2]) * t),
      ];
    }
    hline(0, y, W, c);
  }
  // bottom cream title band
  fillRect(0, 760, W, 264, C.cream);
  fillRect(0, 760, W, 6, C.gold);
  fillRect(0, 768, W, 2, C.goldD);

  // top kicker line
  textC(512, 34, "THE TRAVEL BUREAU PRESENTS", 1, C.cream2);
  hline(392, 56, 240, C.gold);

  // sun, low and large, right of centre
  disc(768, 250, 82, C.sunD);
  disc(768, 250, 74, C.sun);
  circle(768, 250, 92, C.sun);
  circle(768, 250, 100, C.sunD);

  // high wispy clouds
  cloud(180, 140, 90, 16, C.cloud);
  cloud(880, 110, 70, 12, C.cloud);
  cloud(560, 90, 60, 10, C.cloud);

  // ---- glass balloon, upper left
  ellipse(200, 210, 66, 82, C.red);
  ellipse(200, 210, 34, 82, C.cream);
  circle(200, 210, 66, C.red);
  line(150, 260, 188, 312, C.ink);
  line(250, 260, 212, 312, C.ink);
  line(200, 292, 200, 312, C.ink);
  fillRect(184, 312, 32, 28, C.trunk);
  fillRect(184, 312, 32, 4, C.goldD);
  // tiny flag on the balloon
  line(200, 128, 200, 104, C.ink);
  poly([[200, 104], [228, 111], [200, 118]], C.gold);

  // birds (fixed positions)
  bird(430, 180, 12); bird(480, 150, 10); bird(520, 200, 9);
  bird(620, 140, 11); bird(880, 330, 10);

  // ---- left floating island
  island(72, 316, 500, 648, 190);
  tree(120, 500, 16); tree(180, 500, 20); tree(262, 500, 14);
  // small white cottage on the left island
  fillRect(210, 462, 52, 38, C.white);
  poly([[206, 462], [264, 462], [235, 440]], C.red);
  fillRect(230, 478, 10, 22, C.trunk);
  waterfall(96, 526, 690, 12);

  // ---- right floating island
  island(724, 968, 540, 668, 850);
  tree(780, 540, 18); tree(920, 540, 15);
  // little watchtower
  fillRect(828, 492, 34, 48, C.white);
  poly([[824, 492], [866, 492], [845, 470]], C.teal);
  fillRect(840, 506, 10, 16, C.trunk);
  waterfall(940, 566, 700, 12);

  // ---- central island: the great terrace of Velmora
  // stepped garden terraces rising to the temple
  fillRect(356, 372, 312, 30, C.grassD);
  fillRect(356, 372, 312, 8, C.grassL);
  fillRect(316, 402, 392, 30, C.grass);
  fillRect(316, 402, 392, 8, C.grassL);
  island(276, 748, 432, 700, 512);
  // white temple with a gold dome, centre of the terrace
  fillRect(468, 330, 88, 72, C.white);
  fillRect(468, 330, 88, 6, C.gold);
  disc(512, 330, 34, C.gold);
  disc(512, 330, 26, C.sun);
  for (let i = 0; i < 4; i++) vline(480 + i * 20, 344, 58, C.teal);
  fillRect(500, 372, 24, 30, C.trunk);
  // garden trees on the terraces
  tree(360, 402, 18); tree(420, 372, 14); tree(600, 372, 16); tree(664, 402, 18);
  tree(330, 432, 16); tree(700, 432, 14);
  // waterfalls pouring off the great terrace into the cloud sea
  waterfall(300, 458, 700, 16);
  waterfall(708, 458, 700, 16);
  waterfall(512, 470, 690, 10);

  // ---- sea of clouds below the islands (y ~660-760)
  cloud(140, 720, 150, 34, C.cloud);
  cloud(360, 736, 170, 36, C.cloud);
  cloud(620, 724, 160, 34, C.cloud);
  cloud(880, 738, 170, 36, C.cloud);
  cloud(500, 752, 200, 26, C.cloudSh);
  cloud(60, 752, 120, 24, C.cloudSh);
  cloud(960, 752, 120, 24, C.cloudSh);

  // ---- title band
  textC(512, 800, "VELMORA", 12, C.ink);
  // gold rule + side stars under the title
  hline(392, 908, 240, C.gold);
  disc(372, 911, 4, C.gold);
  disc(652, 911, 4, C.gold);
  textC(512, 928, "WHERE THE GARDENS HANG FROM THE SKY", 2, C.teal);
  textC(512, 960, "GLASS BALLOONS LEAVE AT DAWN - NO ROADS, NO MAPS", 2, C.ink);
  textC(512, 992, "THE TRAVEL BUREAU - EST. NEVER, MAP REF. NOWHERE", 1, C.goldD);

  // thin gold frame around the whole poster
  for (let i = 0; i < 4; i++) {
    hline(14, 14 + i, 996, C.gold);
    hline(14, 1006 - i, 996, C.gold);
    vline(14 + i, 14, 996, C.gold);
    vline(1006 - i, 14, 996, C.gold);
  }
}

draw();
const outDir = "/output";
fs.mkdirSync(outDir, { recursive: true });
const png = encodePNG();
fs.writeFileSync(path.join(outDir, "entry.png"), png);
console.log("wrote /output/entry.png", png.length, "bytes");
