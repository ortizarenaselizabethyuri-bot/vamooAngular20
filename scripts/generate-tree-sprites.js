/**
 * @fileoverview Generador determinista de sprites pixel-art PNG transparentes para árboles estilo Pokémon Clásico.
 * Genera las 4 variantes botánicas (Esférico clásico, Pino andino, Árbol frutal con bayas, Árbol de otoño)
 * en 32x32 y 64x64 con canal alfa puro y spritesheet combinado.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Codificador PNG binario estándar.
 */
function encodePng(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    const crcVal = zlib.crc32(Buffer.concat([typeBuf, data]));
    crc.writeUInt32BE(crcVal >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    scanlines[y * (1 + width * 4)] = 0;
    rgbaBuffer.copy(scanlines, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idat = zlib.deflateSync(scanlines, { level: 9 });

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

/**
 * Lienzo pixel-art para rasterización.
 */
class PixelCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buffer = Buffer.alloc(width * height * 4, 0);
  }

  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    if (a < 255) {
      const bgA = this.buffer[idx + 3] / 255;
      const fgA = a / 255;
      const outA = fgA + bgA * (1 - fgA);
      if (outA > 0) {
        this.buffer[idx] = Math.round((r * fgA + this.buffer[idx] * bgA * (1 - fgA)) / outA);
        this.buffer[idx + 1] = Math.round((g * fgA + this.buffer[idx + 1] * bgA * (1 - fgA)) / outA);
        this.buffer[idx + 2] = Math.round((b * fgA + this.buffer[idx + 2] * bgA * (1 - fgA)) / outA);
        this.buffer[idx + 3] = Math.round(outA * 255);
      }
    } else {
      this.buffer[idx] = r;
      this.buffer[idx + 1] = g;
      this.buffer[idx + 2] = b;
      this.buffer[idx + 3] = 255;
    }
  }

  fillRect(x, y, w, h, r, g, b, a = 255) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        this.setPixel(px, py, r, g, b, a);
      }
    }
  }

  strokeRect(x, y, w, h, r, g, b, a = 255) {
    for (let px = x; px < x + w; px++) {
      this.setPixel(px, y, r, g, b, a);
      this.setPixel(px, y + h - 1, r, g, b, a);
    }
    for (let py = y; py < y + h; py++) {
      this.setPixel(x, py, r, g, b, a);
      this.setPixel(x + w - 1, py, r, g, b, a);
    }
  }

  fillEllipse(cx, cy, rx, ry, r, g, b, a = 255) {
    const rx2 = rx * rx;
    const ry2 = ry * ry;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = x - cx;
        const dy = y - cy;
        if ((dx * dx) / rx2 + (dy * dy) / ry2 <= 1) {
          this.setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  fillCircle(cx, cy, radius, r, g, b, a = 255) {
    const r2 = radius * radius;
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) {
          this.setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  fillTriangle(topX, topY, leftX, baseY, rightX, r, g, b, a = 255) {
    for (let y = topY; y <= baseY; y++) {
      const t = (y - topY) / (baseY - topY);
      const xStart = Math.round(topX + (leftX - topX) * t);
      const xEnd = Math.round(topX + (rightX - topX) * t);
      for (let x = xStart; x <= xEnd; x++) {
        this.setPixel(x, y, r, g, b, a);
      }
    }
  }

  scaleNearest(factor) {
    const target = new PixelCanvas(this.width * factor, this.height * factor);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const srcIdx = (y * this.width + x) * 4;
        const r = this.buffer[srcIdx];
        const g = this.buffer[srcIdx + 1];
        const b = this.buffer[srcIdx + 2];
        const a = this.buffer[srcIdx + 3];
        if (a > 0) {
          target.fillRect(x * factor, y * factor, factor, factor, r, g, b, a);
        }
      }
    }
    return target;
  }
}

// ============================================================================
// DISEÑOS DE ÁRBOLES EN VISTA FRONTAL POKÉMON (32x32 px)
// ============================================================================

/**
 * VARIANTE 0: Árbol esférico clásico Pokémon (Pueblo Paleta / GBA).
 */
function drawTreeVariant0() {
  const c = new PixelCanvas(32, 32);

  // 1. Sombra ovalada en la base del suelo
  c.fillEllipse(16, 29, 11, 2.5, 0, 0, 0, 90);

  // 2. Tronco leñoso con textura de corteza
  c.fillRect(14, 20, 4, 9, 120, 53, 15);   // #78350F
  c.strokeRect(14, 20, 4, 9, 28, 25, 23);  // Contorno oscuro
  c.setPixel(15, 23, 69, 26, 3);
  c.setPixel(16, 26, 69, 26, 3);
  // Raíces
  c.setPixel(13, 28, 120, 53, 15);
  c.setPixel(18, 28, 120, 53, 15);

  // 3. Copa esférica Pokémon en 4 niveles concéntricos
  // Contorno circular exterior oscuro
  c.fillCircle(16, 12, 11.2, 2, 44, 34);    // #022C22

  // Nivel 1: Sombra verde bosque profunda
  c.fillCircle(16, 12, 10.5, 6, 78, 59);    // #064E3B

  // Nivel 2: Verde medio frondoso
  c.fillCircle(16, 11, 8.8, 22, 101, 52);   // #166534

  // Nivel 3: Verde vivo iluminado
  c.fillCircle(15.5, 9.5, 6.8, 21, 128, 61); // #15803D

  // Nivel 4: Destello de luz superior
  c.fillCircle(14.5, 8, 4.2, 74, 222, 128);  // #4ADE80

  // Destello en pixel art estilo GBA
  c.setPixel(13, 5, 134, 239, 172);         // #86EFAC
  c.setPixel(14, 5, 134, 239, 172);
  c.setPixel(13, 6, 134, 239, 172);

  return c;
}

/**
 * VARIANTE 1: Pino / Conífera Andina triangular en 3 pisos superpuestos.
 */
function drawTreeVariant1() {
  const c = new PixelCanvas(32, 32);

  // 1. Sombra en el suelo
  c.fillEllipse(16, 29, 10, 2.5, 0, 0, 0, 90);

  // 2. Tronco visible
  c.fillRect(14, 22, 4, 7, 120, 53, 15);
  c.strokeRect(14, 22, 4, 7, 28, 25, 23);

  // 3. Piso inferior de ramas
  c.fillTriangle(16, 14, 5, 24, 27, 2, 44, 34);     // Contorno
  c.fillTriangle(16, 14, 6, 23, 26, 6, 78, 59);     // Verde profundo #064E3B
  // Luces en las puntas inferiores
  c.setPixel(7, 23, 22, 163, 74);
  c.setPixel(25, 23, 22, 163, 74);

  // 4. Piso medio de ramas
  c.fillTriangle(16, 8, 7, 18, 25, 2, 44, 34);      // Contorno
  c.fillTriangle(16, 8, 8, 17, 24, 22, 101, 52);    // Verde medio #166534
  c.setPixel(9, 17, 34, 197, 94);
  c.setPixel(23, 17, 34, 197, 94);

  // 5. Piso superior de ramas (copa cónica)
  c.fillTriangle(16, 3, 10, 12, 22, 2, 44, 34);     // Contorno
  c.fillTriangle(16, 3, 11, 11, 21, 34, 197, 94);   // Verde vivo #22C55E
  // Destello en la coronilla
  c.setPixel(16, 3, 134, 239, 172);
  c.setPixel(16, 4, 134, 239, 172);
  c.setPixel(15, 5, 134, 239, 172);

  return c;
}

/**
 * VARIANTE 2: Árbol frutal con bayas silvestres rojas y doradas (Ruta Pokémon).
 */
function drawTreeVariant2() {
  const c = new PixelCanvas(32, 32);

  // 1. Sombra en el suelo
  c.fillEllipse(16, 29, 11, 2.5, 0, 0, 0, 90);

  // 2. Tronco leñoso
  c.fillRect(14, 20, 4, 9, 120, 53, 15);
  c.strokeRect(14, 20, 4, 9, 28, 25, 23);

  // 3. Copa esférica frondosa
  c.fillCircle(16, 12, 11.2, 2, 44, 34);
  c.fillCircle(16, 12, 10.5, 6, 78, 59);
  c.fillCircle(16, 11, 8.8, 22, 101, 52);
  c.fillCircle(15.5, 9.5, 6.8, 21, 128, 61);
  c.fillCircle(14.5, 8, 4.2, 74, 222, 128);

  // 4. Bayas silvestres incrustadas en el follaje
  // Bayas rojas estilo Baya Frambu (#EF4444 con destello oro)
  const redBerries = [
    [10, 10], [21, 12], [14, 17], [18, 15]
  ];
  redBerries.forEach(([bx, by]) => {
    c.fillRect(bx, by, 2, 2, 239, 68, 68);
    c.setPixel(bx, by, 254, 240, 138); // Brillo
  });

  // Bayas doradas estilo Baya Zidra (#FACC15)
  const goldBerries = [
    [13, 8], [19, 7], [11, 15], [20, 9]
  ];
  goldBerries.forEach(([bx, by]) => {
    c.fillRect(bx, by, 2, 2, 250, 204, 21);
    c.setPixel(bx, by, 255, 255, 255);
  });

  return c;
}

/**
 * VARIANTE 3: Árbol de otoño andino (follaje dorado y naranja rojizo para zonas #F8E3A6).
 */
function drawTreeVariant3() {
  const c = new PixelCanvas(32, 32);

  // 1. Sombra en el suelo
  c.fillEllipse(16, 29, 11, 2.5, 0, 0, 0, 90);

  // 2. Hojitas otoñales caídas alrededor del tronco
  c.setPixel(9, 28, 234, 88, 12);
  c.setPixel(10, 29, 245, 158, 11);
  c.setPixel(21, 28, 234, 88, 12);
  c.setPixel(22, 29, 245, 158, 11);
  c.setPixel(12, 30, 249, 115, 22);
  c.setPixel(19, 30, 234, 88, 12);

  // 3. Tronco leñoso
  c.fillRect(14, 20, 4, 9, 120, 53, 15);
  c.strokeRect(14, 20, 4, 9, 69, 26, 3);

  // 4. Copa otoñal en 4 capas concéntricas cálidas
  // Contorno leñoso oscuro
  c.fillCircle(16, 12, 11.2, 69, 26, 3);     // #451A03

  // Capa 1: Sombra marrón rojiza fuego
  c.fillCircle(16, 12, 10.5, 154, 52, 18);   // #9A3412

  // Capa 2: Naranja fuego otoñal
  c.fillCircle(16, 11, 8.8, 234, 88, 12);    // #EA580C

  // Capa 3: Naranja vivo cálido
  c.fillCircle(15.5, 9.5, 6.8, 249, 115, 22); // #F97316

  // Capa 4: Destello dorado cálido
  c.fillCircle(14.5, 8, 4.2, 250, 204, 21);  // #FACC15

  // Píxel de brillo superior dorado pálido estilo GBA
  c.setPixel(13, 5, 254, 240, 138);          // #FEF08A
  c.setPixel(14, 5, 254, 240, 138);
  c.setPixel(13, 6, 254, 240, 138);

  return c;
}

/**
 * Genera una tira horizontal (spritesheet).
 */
function createSpriteSheet(variants) {
  const w = variants[0].width;
  const h = variants[0].height;
  const sheet = new PixelCanvas(w * variants.length, h);

  variants.forEach((v, idx) => {
    const offsetX = idx * w;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const srcIdx = (y * w + x) * 4;
        const r = v.buffer[srcIdx];
        const g = v.buffer[srcIdx + 1];
        const b = v.buffer[srcIdx + 2];
        const a = v.buffer[srcIdx + 3];
        if (a > 0) {
          sheet.setPixel(offsetX + x, y, r, g, b, a);
        }
      }
    }
  });

  return sheet;
}

// ============================================================================
// EJECUCIÓN PRINCIPAL: GUARDAR SPRITES EN PUBLIC/ASSETS/SPRITES
// ============================================================================

const outDirTrees = path.join(__dirname, '..', 'public', 'assets', 'sprites', 'trees');
const outDirSprites = path.join(__dirname, '..', 'public', 'assets', 'sprites');

fs.mkdirSync(outDirTrees, { recursive: true });
fs.mkdirSync(outDirSprites, { recursive: true });

console.log('Generando árboles estilo Pokémon clásico...');

const t0_32 = drawTreeVariant0();
const t1_32 = drawTreeVariant1();
const t2_32 = drawTreeVariant2();
const t3_32 = drawTreeVariant3();

const t0_64 = t0_32.scaleNearest(2);
const t1_64 = t1_32.scaleNearest(2);
const t2_64 = t2_32.scaleNearest(2);
const t3_64 = t3_32.scaleNearest(2);

const sheet32 = createSpriteSheet([t0_32, t1_32, t2_32, t3_32]);
const sheet64 = createSpriteSheet([t0_64, t1_64, t2_64, t3_64]);

const files = [
  // 32x32 nativo
  { name: 'tree_variant_0_classic_32.png', canvas: t0_32, dir: outDirTrees },
  { name: 'tree_variant_1_pine_32.png', canvas: t1_32, dir: outDirTrees },
  { name: 'tree_variant_2_berry_32.png', canvas: t2_32, dir: outDirTrees },
  { name: 'tree_variant_3_autumn_32.png', canvas: t3_32, dir: outDirTrees },
  // 64x64 HD
  { name: 'tree_variant_0_classic_64.png', canvas: t0_64, dir: outDirTrees },
  { name: 'tree_variant_1_pine_64.png', canvas: t1_64, dir: outDirTrees },
  { name: 'tree_variant_2_berry_64.png', canvas: t2_64, dir: outDirTrees },
  { name: 'tree_variant_3_autumn_64.png', canvas: t3_64, dir: outDirTrees },
  // Sprites primarios en trees/
  { name: 'tree_0.png', canvas: t0_64, dir: outDirTrees },
  { name: 'tree_1.png', canvas: t1_64, dir: outDirTrees },
  { name: 'tree_2.png', canvas: t2_64, dir: outDirTrees },
  { name: 'tree_3.png', canvas: t3_64, dir: outDirTrees },
  // Spritesheets
  { name: 'tree_spritesheet_32.png', canvas: sheet32, dir: outDirTrees },
  { name: 'tree_spritesheet_64.png', canvas: sheet64, dir: outDirTrees },
  // Sprites directos para el motor cartográfico
  { name: 'tree_0.png', canvas: t0_64, dir: outDirSprites },
  { name: 'tree_1.png', canvas: t1_64, dir: outDirSprites },
  { name: 'tree_2.png', canvas: t2_64, dir: outDirSprites },
  { name: 'tree_3.png', canvas: t3_64, dir: outDirSprites },
];

files.forEach(f => {
  const filePath = path.join(f.dir, f.name);
  const data = encodePng(f.canvas.width, f.canvas.height, f.canvas.buffer);
  fs.writeFileSync(filePath, data);
  console.log(`[OK] Guardado: ${f.name} (${f.canvas.width}x${f.canvas.height})`);
});

console.log('Árboles estilo Pokémon clásico generados con éxito.');
