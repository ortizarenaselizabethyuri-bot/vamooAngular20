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
});

