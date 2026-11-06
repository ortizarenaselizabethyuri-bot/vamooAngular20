import { getNearbyPois, generateLocalNeighborhoodPois, MASTER_POI_CATALOG } from './poi-catalog.js';
import { RpgMapEngine } from './rpg-map-engine.js';

describe('PoiCatalog & Dynamic Nearby Places', () => {
  it('debe contener un catálogo maestro con lugares auténticos en Huancayo, El Tambo, Chilca y San Carlos', () => {
    expect(MASTER_POI_CATALOG.length).toBeGreaterThanOrEqual(30);

    const categories = new Set(MASTER_POI_CATALOG.map((p) => p.category));
    expect(categories.has('pharmacy')).toBe(true);
    expect(categories.has('park')).toBe(true);
    expect(categories.has('school')).toBe(true);
    expect(categories.has('hotel')).toBe(true);
    expect(categories.has('store')).toBe(true);
    expect(categories.has('hospital')).toBe(true);
  });

  it('debe resolver los lugares más cercanos al Centro de Huancayo (-12.0681, -75.2100)', () => {
    const centroCoords = { lat: -12.0681, lng: -75.2100 };
    const nearby = getNearbyPois(centroCoords, { maxRadiusMeters: 1500, limit: 10 });

    expect(nearby.length).toBeGreaterThan(0);
    // El primer lugar debe estar a menos de 100m (ej. Plaza Constitución)
    const closestDist = RpgMapEngine.calculateDistanceMeters(centroCoords, nearby[0].coords);
    expect(closestDist).toBeLessThan(100);

    // Debe contener lugares emblemáticos del centro
    const names = nearby.map((p) => p.name);
    expect(names.some((n) => n.includes('Plaza') || n.includes('Huamanmarca') || n.includes('Real'))).toBe(true);

    // Todos los resultados deben estar ordenados por distancia ascendente
    for (let i = 1; i < nearby.length; i++) {
      const distPrev = RpgMapEngine.calculateDistanceMeters(centroCoords, nearby[i - 1].coords);
      const distCurr = RpgMapEngine.calculateDistanceMeters(centroCoords, nearby[i].coords);
      expect(distCurr).toBeGreaterThanOrEqual(distPrev);
    }
  });

  it('debe resolver lugares propios de El Tambo al ubicarse en el sector norte (-12.0503, -75.2213)', () => {
    const tamboCoords = { lat: -12.0503, lng: -75.2213 };
    const nearby = getNearbyPois(tamboCoords, { maxRadiusMeters: 1500, limit: 8 });

    expect(nearby.length).toBeGreaterThan(0);
    // El primer lugar en El Tambo debe estar a menos de 50m (Plaza de El Tambo)
    const distTambo = RpgMapEngine.calculateDistanceMeters(tamboCoords, nearby[0].coords);
    expect(distTambo).toBeLessThan(50);

    // Debe incluir lugares del sector El Tambo y NO del centro como prioritarios
    const names = nearby.map((p) => p.name);
    expect(names.some((n) => n.includes('El Tambo') || n.includes('Castilla'))).toBe(true);
  });

  it('debe resolver lugares propios de Chilca al ubicarse en el sector sur (-12.08626, -75.20826)', () => {
    const chilcaCoords = { lat: -12.08626, lng: -75.20826 };
    const nearby = getNearbyPois(chilcaCoords, { maxRadiusMeters: 1500, limit: 8 });

    expect(nearby.length).toBeGreaterThan(0);
    // Plaza de Chilca debe estar exactamente en la posición (distancia < 5m)
    const distChilca = RpgMapEngine.calculateDistanceMeters(chilcaCoords, nearby[0].coords);
    expect(distChilca).toBeLessThan(5);

    const names = nearby.map((p) => p.name);
    expect(names.some((n) => n.includes('Chilca'))).toBe(true);
  });

  it('debe sintetizar lugares locales deterministas para usuarios en zonas periféricas o sin catálogo previo', () => {
    // Coordenadas simuladas en una zona periférica o fuera de la cuadrícula catalogada
    const remoteCoords = { lat: -11.9500, lng: -75.3000 };
    const nearby = getNearbyPois(remoteCoords, { maxRadiusMeters: 2000, limit: 8 });

    expect(nearby.length).toBeGreaterThanOrEqual(6);
    // Todos los lugares generados deben estar cerca del usuario (menos de 700 metros)
    for (const poi of nearby) {
      const dist = RpgMapEngine.calculateDistanceMeters(remoteCoords, poi.coords);
      expect(dist).toBeLessThan(700);
      expect(dist).toBeGreaterThan(50);
    }

    // Comprobar presencia de categorías esenciales: botica, parque, escuela, hotel
    const cats = nearby.map((p) => p.category);
    expect(cats).toContain('pharmacy');
    expect(cats).toContain('park');
    expect(cats).toContain('school');
    expect(cats).toContain('hotel');
  });

  it('debe generar determinísticamente lugares con coordenadas estables para un mismo cuadrante', () => {
    const coords = { lat: -12.01234, lng: -75.18567 };
    const gen1 = generateLocalNeighborhoodPois(coords, 5);
    const gen2 = generateLocalNeighborhoodPois(coords, 5);

    expect(gen1.length).toBe(5);
    expect(gen2.length).toBe(5);
    expect(gen1[0].id).toBe(gen2[0].id);
    expect(gen1[0].coords.lat).toBe(gen2[0].coords.lat);
    expect(gen1[0].coords.lng).toBe(gen2[0].coords.lng);
  });
});
