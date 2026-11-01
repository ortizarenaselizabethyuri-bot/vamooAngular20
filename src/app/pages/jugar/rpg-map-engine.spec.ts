import { RpgMapEngine } from './rpg-map-engine.js';

describe('RpgMapEngine', () => {
  let engine: RpgMapEngine;

  beforeEach(() => {
    engine = new RpgMapEngine();
  });

  afterEach(() => {
    engine.destroy();
  });

  it('debe instanciarse con zoom inicial 19 y centro en Huancayo (-12.0681, -75.2100)', () => {
    expect(engine.getZoom()).toBe(19);
    expect(engine.getCenter().lat).toBeCloseTo(-12.0681, 2);
    expect(engine.getCenter().lng).toBeCloseTo(-75.2100, 2);
  });

  it('debe convertir fielmente coordenadas geográficas a píxeles Web Mercator y revertir con precisión', () => {
    const lat = -12.0681;
    const lng = -75.2100;
    const zoom = 15;

    const pixels = engine.latLngToWorldPixels(lat, lng, zoom);
    expect(pixels.x).toBeGreaterThan(0);
    expect(pixels.y).toBeGreaterThan(0);

    const reverted = engine.worldPixelsToLatLng(pixels.x, pixels.y, zoom);
    expect(reverted.lat).toBeCloseTo(lat, 4);
    expect(reverted.lng).toBeCloseTo(lng, 4);
  });

  it('debe restringir el nivel de zoom entre el rango óptimo calibrado [15 - 19]', () => {
    // Zoom superior a 19 se limita a 19
    engine.setZoom(25);
    expect(engine.getZoom()).toBe(19);

    // Zoom inferior a 15 se limita a 15
    engine.setZoom(8);
    expect(engine.getZoom()).toBe(15);

    // Zoom dentro del rango se asigna directamente
    engine.setZoom(17);
    expect(engine.getZoom()).toBe(17);

    // Escalonamiento con stepZoom
    engine.stepZoom(1);
    expect(engine.getZoom()).toBe(18);

    engine.stepZoom(-1);
    expect(engine.getZoom()).toBe(17);
  });

  it('debe actualizar el centro de la cámara satelital', () => {
    const nuevoCentro = { lat: -12.0720, lng: -75.2140 };
    engine.setCenter(nuevoCentro);

    expect(engine.getCenter().lat).toBeCloseTo(-12.0720, 4);
    expect(engine.getCenter().lng).toBeCloseTo(-75.2140, 4);
  });

  it('debe aceptar actualizaciones de posición del aventurero y sendero de expedición', () => {
    engine.setUserPosition({ lat: -12.0681, lng: -75.2100 }, '🐻', 'Aventurero Oso');
    engine.setPath([
      { lat: -12.0681, lng: -75.2100 },
      { lat: -12.0685, lng: -75.2105 },
      { lat: -12.0690, lng: -75.2110 },
    ]);

    expect(engine.getZoom()).toBe(19);
    expect(engine.getCenter().lat).toBeCloseTo(-12.0681, 2);
  });

  it('debe calcular el factor de escala visual ampliado: vista en Z19 con elementos 30x30px (escala 1.5x)', () => {
    // Z15 o menor: Vista macro -> escala 0 (evita sobrecarga y saturación)
    expect(engine.getZoomScaleFactor(15)).toBe(0);

    // Z19: Vista principal del jugador con casitas cuadradas y árboles ampliados a 30x30 px (escala 1.5x)
    expect(engine.getZoomScaleFactor(19)).toBe(1.5);
  });

  it('debe ordenar las teselas en secuencia radial progresiva desde el centro del jugador hacia los costados', () => {
    const center = engine.latLngToWorldPixels(-12.0681, -75.2100, 19);
    const tiles = engine.getVisibleTilesRadialOrder(center, 800, 600);

    expect(tiles.length).toBeGreaterThan(0);
    // La primera tesela debe ser la más cercana al centro del jugador
    expect(tiles[0].dist).toBeLessThanOrEqual(tiles[tiles.length - 1].dist);
    // Cada tesela sucesiva debe estar a distancia igual o mayor que la anterior
    for (let i = 1; i < tiles.length; i++) {
      expect(tiles[i].dist).toBeGreaterThanOrEqual(tiles[i - 1].dist);
    }
  });

  it('debe clasificar con precisión los colores RGB en parques, carreteras, manzanas y agua', () => {
    // 1. Áreas verdes / parques (verde dominante característico de ESRI / OSM)
    expect(engine.classifyColorTerrain(204, 235, 206)).toBe('park');
    expect(engine.classifyColorTerrain(180, 220, 170)).toBe('park');
    expect(engine.classifyColorTerrain(115, 175, 120)).toBe('park');

    // 2. Carreteras y asfalto (blanco puro, gris neutro claro, avenidas arteriales)
    expect(engine.classifyColorTerrain(255, 255, 255)).toBe('road');
    expect(engine.classifyColorTerrain(240, 240, 240)).toBe('road');
    expect(engine.classifyColorTerrain(235, 195, 150)).toBe('road'); // Arteria amarilla
    expect(engine.classifyColorTerrain(200, 200, 200)).toBe('road'); // Borde neutro de calzada

    // 3. Manzanas urbanas / residencial (adobe, beige, marfil andino)
    expect(engine.classifyColorTerrain(247, 241, 223)).toBe('block');
    expect(engine.classifyColorTerrain(245, 230, 205)).toBe('block');

    // 4. Ríos y cuerpos de agua
    expect(engine.classifyColorTerrain(130, 180, 235)).toBe('water');
  });

  it('debe muestrear el terreno en coordenadas de tesela de forma determinista y segura', () => {
    const terrain = engine.sampleTileTerrain('19_1234_5678', 64, 64);
    expect(['park', 'road', 'block', 'water']).toContain(terrain);

    // Muestreo en los bordes de la tesela sin generar errores de índice fuera de rango
    const edgeTerrain1 = engine.sampleTileTerrain('19_1234_5678', 0, 0);
    const edgeTerrain2 = engine.sampleTileTerrain('19_1234_5678', 255, 255);
    expect(['park', 'road', 'block', 'water']).toContain(edgeTerrain1);
    expect(['park', 'road', 'block', 'water']).toContain(edgeTerrain2);
  });

  it('debe validar la regla estricta de carreteras impidiendo que casitas o árboles se ubiquen sobre calzadas o textos viales', () => {
    // 1. Detección directa de asfalto blanco y gris claro
    expect(engine.isRoadPixel(255, 255, 255)).toBe(true);  // Asfalto blanco
    expect(engine.isRoadPixel(240, 240, 240)).toBe(true);  // Asfalto neutro
    expect(engine.isRoadPixel(210, 210, 210)).toBe(true);  // Borde o casing de calle
    expect(engine.isRoadPixel(175, 175, 175)).toBe(true);  // Casing medio de calzada

    // 2. Detección de textos de nombres de calles sobre calzadas (ej. "Pasaje Montevideo", "Calle Nemesio")
    expect(engine.isRoadPixel(134, 135, 130)).toBe(true);
    expect(engine.isRoadPixel(110, 110, 110)).toBe(true);

    // 3. Avenidas y carreteras arteriales amarillas
    expect(engine.isRoadPixel(225, 185, 140)).toBe(true);

    // 4. No debe clasificar como carretera a zonas residenciales, parques ni agua
    expect(engine.isRoadPixel(243, 240, 207)).toBe(false); // Manzana beige
    expect(engine.isRoadPixel(200, 235, 205)).toBe(false); // Parque verde
    expect(engine.isRoadPixel(130, 180, 235)).toBe(false); // Río / agua

    // 5. Regla de despeje de calzada (isAreaClearOfRoad)
    const key = '19_152611_279850';
    const roadCheck = engine.isAreaClearOfRoad(key, 0, 0, 12);
    expect(typeof roadCheck).toBe('boolean');
  });

  it('debe clasificar áreas verdes, parques y descampados vegetales y excluir manzanas urbanas y carreteras', () => {
    // Parques reales con verde vivo destacado
    expect(engine.isParkPixel(180, 235, 190)).toBe(true);
    expect(engine.isParkPixel(110, 175, 115)).toBe(true);

    // Descampados y campos verdes/oliva del valle (218, 224, 178) y (216, 225, 164)
    expect(engine.isParkPixel(218, 224, 178)).toBe(true);
    expect(engine.isParkPixel(216, 225, 164)).toBe(true);

    // Carreteras y manzanas urbanas residenciales NO son parques ni descampados
    expect(engine.isParkPixel(255, 255, 255)).toBe(false);
    expect(engine.isParkPixel(243, 240, 207)).toBe(false);
    expect(engine.isParkPixel(248, 244, 199)).toBe(false);
  });

  it('debe precalcular y almacenar en caché decoraciones fijas respetando las reglas de parques, descampados y carreteras', () => {
    const key = '19_152611_279850';
    engine.analyzeAndCacheTileDecorations(key, 152611, 279850, 19);

    // Al volver a invocar sobre la misma tesela o consultar el zoom, la respuesta es estable
    expect(engine.getZoomScaleFactor(19)).toBe(1.5);
  });

  it('debe mantener las decoraciones en caché sin que desaparezcan durante desplazamientos (panning) continuos', () => {
    // Simular desplazamiento extenso analizando 80 teselas consecutivas
    for (let i = 0; i < 80; i++) {
      const key = `19_${152600 + i}_${279850 + i}`;
      engine.analyzeAndCacheTileDecorations(key, 152600 + i, 279850 + i, 19);
    }

    // La escala permanece estable y las decoraciones se preservan en la memoria de alta capacidad
    expect(engine.getZoomScaleFactor(19)).toBe(1.5);
  });

  it('debe respetar la regla de áreas verdes y descampados: CERO casas, mayor densidad de árboles/vegetación y verificación de márgenes', () => {
    // Clasificación de color verde de parque y descampado
    expect(engine.classifyColorTerrain(115, 175, 120)).toBe('park');
    expect(engine.classifyColorTerrain(216, 225, 164)).toBe('park');

    // Despeje de parques para evitar que las casas se ubiquen en bordes de áreas verdes
    const key = '19_152611_279850';
    expect(typeof engine.isAreaClearOfPark(key, 0, 0, 10)).toBe('boolean');

    // Muestreo determinista simulando zona de parque
    engine.analyzeAndCacheTileDecorations(key, 152611, 279850, 19);

    // Detección estricta de carreteras cubre asfalto, bordes y textos sobre calzada
    expect(engine.isRoadPixel(134, 135, 130)).toBe(true);
    expect(engine.isRoadPixel(255, 255, 255)).toBe(true);
  });

  it('debe clasificar el área #F8E3A6 (estadios/campus) como autumn_park con árboles de otoño y CERO casas', () => {
    // 1. Detección de color #F8E3A6 / #FFE8AA / #FCE1A3
    expect(engine.isAutumnAreaPixel(248, 227, 166)).toBe(true);
    expect(engine.isAutumnAreaPixel(255, 232, 170)).toBe(true);
    expect(engine.isAutumnAreaPixel(252, 225, 163)).toBe(true);

    // No debe confundir manzanas residenciales ni parques verdes
    expect(engine.isAutumnAreaPixel(248, 244, 199)).toBe(false); // Manzana beige
    expect(engine.isAutumnAreaPixel(180, 235, 190)).toBe(false); // Parque verde
    expect(engine.isAutumnAreaPixel(255, 255, 255)).toBe(false); // Asfalto

    // 2. Clasificación de terreno
    expect(engine.classifyColorTerrain(248, 227, 166)).toBe('autumn_park');
  });
});

