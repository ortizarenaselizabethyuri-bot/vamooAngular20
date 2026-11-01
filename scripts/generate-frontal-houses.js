/**
 * @fileoverview Generador de casas estilo Pokémon Clásico en VISTA FRONTAL pura (Front-facing orthographic).
 * Estilo visual 1:1 con Pueblo Paleta / Villa Raíz (Game Boy Advance / FireRed / Emerald).
 * Produce sprites PNG transparentes en 32x32 y 64x64 con canal alfa puro y detalles de jardineras, chimeneas y buzones.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Codificador PNG binario estándar con compresión Deflate y CRC32.
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
 * Lienzo para dibujo de pixel art en cuadrícula.
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
// DISEÑOS DE CASAS EN VISTA FRONTAL PURA (32x32 px)
// ============================================================================

/**
 * VARIANTE 0: Casa Clásica de Pueblo Paleta (Tejado Rojo/Terracota frontal con chimenea, jardinera y buzón)
 */
function drawFrontalHouseVariant0() {
  const c = new PixelCanvas(32, 32);

  // 1. Sombra en el suelo
  c.fillEllipse(16, 30, 13, 2, 0, 0, 0, 90);

  // 2. Chimenea en el tejado (superior derecha)
  c.fillRect(22, 2, 4, 6, 226, 232, 240); // Sillar blanco #E2E8F0
  c.fillRect(21, 1, 6, 2, 148, 163, 184); // Boca chimenea
  c.setPixel(23, 1, 30, 41, 59);          // Hueco oscuro
  c.setPixel(24, 1, 30, 41, 59);
  c.strokeRect(22, 2, 4, 6, 51, 65, 85);
  // Humo sutil
  c.setPixel(23, 0, 241, 245, 249, 140);
  c.setPixel(24, 0, 241, 245, 249, 190);

  // 3. Tejado a dos aguas frontal (inclinación frontal simétrica)
  // Líneas del tejado desde la cumbrera (y=5, ancho 14) hasta el alero (y=15, ancho 28)
  for (let y = 5; y <= 15; y++) {
    const t = (y - 5) / 10;
    const halfWidth = Math.round(7 + 7 * t);
    const leftX = 16 - halfWidth;
    const rightX = 16 + halfWidth;

    // Relleno tejas terracota viva
    for (let x = leftX; x <= rightX; x++) {
      c.setPixel(x, y, 234, 88, 12); // #EA580C
    }

    // Contorno exterior negro puro estilo Pokémon
    c.setPixel(leftX, y, 15, 23, 42);
    c.setPixel(rightX, y, 15, 23, 42);
  }

  // Cumbrera superior destacada (y=4..5)
  c.fillRect(9, 4, 14, 2, 249, 115, 22); // #F97316
  c.strokeRect(9, 4, 14, 2, 15, 23, 42);

  // Franjas y relieves de tejas horizontales clásicas de Pokémon
  const tileRows = [8, 11, 14];
  tileRows.forEach((rowY, idx) => {
    const t = (rowY - 5) / 10;
    const halfW = Math.round(7 + 7 * t) - 1;
    for (let x = 16 - halfW; x <= 16 + halfW; x++) {
      c.setPixel(x, rowY, 194, 65, 12); // Sombra de teja #C2410C
      if (idx < 2) {
        c.setPixel(x, rowY - 1, 251, 146, 60); // Brillo superior #FB923C
      }
    }
  });

  // Alero inferior ancho que sobresale y proyecta sombra
  c.fillRect(2, 15, 28, 2, 154, 52, 18); // #9A3412
  c.strokeRect(2, 15, 28, 2, 15, 23, 42);

  // 4. Muro frontal de la casa (y=17 a 29, ancho 24)
  c.fillRect(4, 17, 24, 12, 255, 247, 237); // Crema cálido #FFF7ED
  // Sombra del alero en el muro
  c.fillRect(4, 17, 24, 2, 254, 215, 170);   // #FED7AA
  // Zócalo de piedra en la base
  c.fillRect(4, 27, 24, 2, 217, 119, 6);     // #D97706
  // Contornos laterales y base
  c.strokeRect(4, 17, 24, 12, 15, 23, 42);

  // 5. Puerta frontal (izquierda)
  c.fillRect(7, 20, 6, 9, 133, 77, 14);     // Madera #854D0E
  c.strokeRect(7, 20, 6, 9, 15, 23, 42);    // Marco negro
  c.setPixel(11, 24, 250, 204, 21);         // Pomo dorado #FACC15
  c.setPixel(11, 25, 202, 138, 4);
  // Escalón / felpudo frontal
  c.fillRect(6, 29, 8, 1, 148, 163, 184);   // Felpudo #94A3B8

  // 6. Ventana frontal con jardinera de flores (derecha)
  c.fillRect(17, 19, 7, 6, 96, 165, 250);   // Vidrio azul #60A5FA
  c.strokeRect(17, 19, 7, 6, 15, 23, 42);   // Marco
  // Cruceta blanca
  for (let y = 20; y <= 23; y++) c.setPixel(20, y, 255, 255, 255);
  for (let x = 18; x <= 22; x++) c.setPixel(x, 21, 255, 255, 255);
  // Reflejo
  c.setPixel(18, 20, 239, 246, 255);

  // Jardinera con florecillas bajo la ventana
  c.fillRect(16, 25, 9, 2, 120, 53, 15);    // Caja de madera #78350F
  c.setPixel(17, 25, 239, 68, 68);          // Flor roja #EF4444
  c.setPixel(19, 25, 250, 204, 21);         // Flor amarilla #FACC15
  c.setPixel(21, 25, 236, 72, 153);         // Flor rosa #EC4899
  c.setPixel(23, 25, 239, 68, 68);          // Flor roja
  c.setPixel(18, 25, 22, 163, 74);          // Hoja verde
  c.setPixel(20, 25, 22, 163, 74);
  c.setPixel(22, 25, 22, 163, 74);

  // 7. Buzón frontal al lado izquierdo
  c.fillRect(2, 23, 2, 5, 239, 68, 68);     // Buzón rojo #EF4444
  c.strokeRect(2, 23, 2, 5, 15, 23, 42);
  c.fillRect(2, 28, 2, 2, 120, 53, 15);     // Poste de madera

  return c;
}

/**
 * VARIANTE 1: Cabaña Portuaria / Montañesa (Tejado Azul Cobalto frontal, sillar blanco, farol encendido)
 */
function drawFrontalHouseVariant1() {
  const c = new PixelCanvas(32, 32);

  // 1. Sombra en el suelo
  c.fillEllipse(16, 30, 13, 2, 0, 0, 0, 90);

  // 2. Chimenea de sillar
  c.fillRect(6, 2, 4, 6, 241, 245, 249);
  c.fillRect(5, 1, 6, 2, 100, 116, 139);
  c.setPixel(7, 1, 15, 23, 42);
  c.setPixel(8, 1, 15, 23, 42);
  c.strokeRect(6, 2, 4, 6, 15, 23, 42);

  // 3. Tejado a dos aguas azul cobalto frontal
  for (let y = 5; y <= 15; y++) {
    const t = (y - 5) / 10;
    const halfWidth = Math.round(7 + 7 * t);
    const leftX = 16 - halfWidth;
    const rightX = 16 + halfWidth;

    for (let x = leftX; x <= rightX; x++) {
      c.setPixel(x, y, 29, 78, 216); // #1D4ED8
    }

    c.setPixel(leftX, y, 15, 23, 42);
    c.setPixel(rightX, y, 15, 23, 42);
  }

  // Cumbrera superior zafiro brillante
  c.fillRect(9, 4, 14, 2, 59, 130, 246); // #3B82F6
  c.strokeRect(9, 4, 14, 2, 15, 23, 42);

  // Franjas de tejas cobalto
  const tileRows = [8, 11, 14];
  tileRows.forEach((rowY, idx) => {
    const t = (rowY - 5) / 10;
    const halfW = Math.round(7 + 7 * t) - 1;
    for (let x = 16 - halfW; x <= 16 + halfW; x++) {
      c.setPixel(x, rowY, 30, 58, 138); // #1E3A8A
      if (idx < 2) {
        c.setPixel(x, rowY - 1, 96, 165, 250); // #60A5FA
      }
    }
  });

  // Alero inferior cobalto oscuro
  c.fillRect(2, 15, 28, 2, 30, 58, 138);
  c.strokeRect(2, 15, 28, 2, 15, 23, 42);

  // 4. Muro frontal de sillar blanco con bloques de piedra
  c.fillRect(4, 17, 24, 12, 248, 250, 252); // #F8FAFC
  c.fillRect(4, 17, 24, 2, 203, 213, 225);   // Sombra alero #CBD5E1
  c.fillRect(4, 27, 24, 2, 100, 116, 139);   // Zócalo granito #64748B
  c.strokeRect(4, 17, 24, 12, 15, 23, 42);

  // Juntas de mortero de sillar sutiles
  c.setPixel(10, 19, 203, 213, 225);
  c.setPixel(16, 19, 203, 213, 225);
  c.setPixel(22, 19, 203, 213, 225);
  c.setPixel(14, 23, 203, 213, 225);

  // 5. Puerta frontal (izquierda)
  c.fillRect(7, 20, 6, 9, 69, 26, 3);       // Nogal oscuro #451A03
  c.strokeRect(7, 20, 6, 9, 15, 23, 42);
  c.setPixel(11, 24, 250, 204, 21);         // Pomo oro
  c.fillRect(6, 29, 8, 1, 100, 116, 139);   // Peldaño granito

  // 6. Farol de pared encendido entre la puerta y la ventana
  c.setPixel(14, 21, 51, 65, 85);           // Brazo metálico
  c.fillRect(13, 22, 3, 3, 250, 204, 21);   // Farol dorado #FACC15
  c.strokeRect(13, 22, 3, 3, 15, 23, 42);
  c.setPixel(14, 23, 254, 240, 138);        // Núcleo brillante #FEF08A

  // 7. Ventana frontal celeste glaciar
  c.fillRect(18, 19, 7, 6, 147, 197, 253);  // #93C5FD
  c.strokeRect(18, 19, 7, 6, 15, 23, 42);
  for (let y = 20; y <= 23; y++) c.setPixel(21, y, 255, 255, 255);
  for (let x = 19; x <= 23; x++) c.setPixel(x, 21, 255, 255, 255);
  c.setPixel(19, 20, 255, 255, 255);

  return c;
}

/**
 * VARIANTE 2: Casona Colonial / Histórica (Tejado Ocre de arcilla frontal, portón de arco, dos ventanas)
 */
function drawFrontalHouseVariant2() {
  const c = new PixelCanvas(32, 32);

  // 1. Sombra en el suelo
  c.fillEllipse(16, 30, 13, 2, 0, 0, 0, 90);

  // 2. Tejado a dos aguas ocre frontal con buhardilla central
  for (let y = 5; y <= 15; y++) {
    const t = (y - 5) / 10;
    const halfWidth = Math.round(7 + 7 * t);
    const leftX = 16 - halfWidth;
    const rightX = 16 + halfWidth;

    for (let x = leftX; x <= rightX; x++) {
      c.setPixel(x, y, 180, 83, 9); // #B45309
    }

    c.setPixel(leftX, y, 15, 23, 42);
    c.setPixel(rightX, y, 15, 23, 42);
  }

  // Cumbrera ocre tostada
  c.fillRect(9, 4, 14, 2, 217, 119, 6); // #D97706
  c.strokeRect(9, 4, 14, 2, 15, 23, 42);

  // Franjas de teja colonial
  const tileRows = [8, 11, 14];
  tileRows.forEach((rowY, idx) => {
    const t = (rowY - 5) / 10;
    const halfW = Math.round(7 + 7 * t) - 1;
    for (let x = 16 - halfW; x <= 16 + halfW; x++) {
      c.setPixel(x, rowY, 146, 64, 14); // #92400E
      if (idx < 2) {
        c.setPixel(x, rowY - 1, 217, 119, 6);
      }
    }
  });

  // Pequeña buhardilla superior central (Dormer window estilo clásico)
  c.fillRect(13, 7, 6, 6, 254, 243, 199);  // Muro buhardilla
  c.fillRect(14, 8, 4, 4, 56, 189, 248);   // Vidrio #38BDF8
  c.strokeRect(13, 7, 6, 6, 15, 23, 42);
  c.fillRect(12, 6, 8, 2, 217, 119, 6);    // Tejadillo buhardilla
  c.strokeRect(12, 6, 8, 2, 15, 23, 42);

  // Alero inferior de madera colonial
  c.fillRect(2, 15, 28, 2, 120, 53, 15);   // #78350F
  c.strokeRect(2, 15, 28, 2, 15, 23, 42);

  // 3. Muro frontal de adobe ocre cálido
  c.fillRect(4, 17, 24, 12, 254, 243, 199); // #FEF3C7
  c.fillRect(4, 17, 24, 2, 253, 230, 138);   // Sombra alero
  c.fillRect(4, 27, 24, 2, 146, 64, 14);     // Zócalo colonial #92400E
  c.strokeRect(4, 17, 24, 12, 15, 23, 42);

  // 4. Portón central colonial en arco de medio punto
  c.fillRect(13, 21, 6, 8, 113, 63, 18);    // Madera #713F12
  c.fillRect(14, 20, 4, 2, 113, 63, 18);    // Arco
  c.strokeRect(13, 21, 6, 8, 15, 23, 42);
  // Duelas de madera y aldaba
  c.setPixel(15, 22, 15, 23, 42);
  c.setPixel(15, 25, 15, 23, 42);
  c.setPixel(16, 24, 250, 204, 21);         // Aldaba oro
  c.fillRect(12, 29, 8, 1, 146, 64, 14);    // Umbral de piedra

  // 5. Dos ventanas gemelas laterales
  // Ventana izquierda
  c.fillRect(6, 20, 5, 5, 56, 189, 248);    // #38BDF8
  c.strokeRect(6, 20, 5, 5, 15, 23, 42);
  c.setPixel(7, 21, 255, 255, 255);
  // Ventana derecha
  c.fillRect(21, 20, 5, 5, 56, 189, 248);
  c.strokeRect(21, 20, 5, 5, 15, 23, 42);
  c.setPixel(22, 21, 255, 255, 255);

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

const outDirHouses = path.join(__dirname, '..', 'public', 'assets', 'sprites', 'houses');
const outDirSprites = path.join(__dirname, '..', 'public', 'assets', 'sprites');

fs.mkdirSync(outDirHouses, { recursive: true });
fs.mkdirSync(outDirSprites, { recursive: true });

console.log('Generando casas en vista frontal estilo Pokémon clásico...');

const v0_32 = drawFrontalHouseVariant0();
const v1_32 = drawFrontalHouseVariant1();
const v2_32 = drawFrontalHouseVariant2();

const v0_48 = v0_32.scaleNearest(1.5 | 0 || 1); // fallback
const v0_64 = v0_32.scaleNearest(2);
const v1_64 = v1_32.scaleNearest(2);
const v2_64 = v2_32.scaleNearest(2);

const sheet32 = createSpriteSheet([v0_32, v1_32, v2_32]);
const sheet64 = createSpriteSheet([v0_64, v1_64, v2_64]);

const files = [
  // 32x32 nativo
  { name: 'house_variant_0_terracotta_32.png', canvas: v0_32, dir: outDirHouses },
  { name: 'house_variant_1_cobalt_32.png', canvas: v1_32, dir: outDirHouses },
  { name: 'house_variant_2_colonial_32.png', canvas: v2_32, dir: outDirHouses },
  // 64x64 HD
  { name: 'house_variant_0_terracotta_64.png', canvas: v0_64, dir: outDirHouses },
  { name: 'house_variant_1_cobalt_64.png', canvas: v1_64, dir: outDirHouses },
  { name: 'house_variant_2_colonial_64.png', canvas: v2_64, dir: outDirHouses },
  // Sprites primarios en houses/
  { name: 'house_0.png', canvas: v0_64, dir: outDirHouses },
  { name: 'house_1.png', canvas: v1_64, dir: outDirHouses },
  { name: 'house_2.png', canvas: v2_64, dir: outDirHouses },
  // Spritesheets
  { name: 'house_spritesheet_32.png', canvas: sheet32, dir: outDirHouses },
  { name: 'house_spritesheet_64.png', canvas: sheet64, dir: outDirHouses },
  // Sprites directos para el motor cartográfico
  { name: 'house_0.png', canvas: v0_64, dir: outDirSprites },
  { name: 'house_1.png', canvas: v1_64, dir: outDirSprites },
  { name: 'house_2.png', canvas: v2_64, dir: outDirSprites },
];

files.forEach(f => {
  const filePath = path.join(f.dir, f.name);
  const data = encodePng(f.canvas.width, f.canvas.height, f.canvas.buffer);
  fs.writeFileSync(filePath, data);
  console.log(`[OK] Guardado: ${f.name} (${f.canvas.width}x${f.canvas.height})`);
});

console.log('Casas frontales estilo Pokémon clásico generadas con éxito.');
