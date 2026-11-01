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

  it('debe calcular el factor de escala dinámico por nivel de zoom (Z15 a Z19) para optimización y fidelidad', () => {
    // Z15: Vista macro más amplia -> escala 0 (evita sobrecarga y saturación)
    expect(engine.getZoomScaleFactor(15)).toBe(0);

    // Z16: Vista panorámica ligera -> escala 0.50
    expect(engine.getZoomScaleFactor(16)).toBe(0.50);

    // Z17: Vista intermedia de barrio -> escala 0.70
    expect(engine.getZoomScaleFactor(17)).toBe(0.70);

    // Z18: Vista suburbana detallada -> escala 0.85
    expect(engine.getZoomScaleFactor(18)).toBe(0.85);

    // Z19: Vista principal del jugador -> escala 1.00 (máximo detalle)
    expect(engine.getZoomScaleFactor(19)).toBe(1.00);
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
});

