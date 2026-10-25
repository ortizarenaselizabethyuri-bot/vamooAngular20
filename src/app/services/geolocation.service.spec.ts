import { TestBed } from '@angular/core/testing';
import { GeolocationService, GeoCoordinates } from './geolocation.service.js';

describe('GeolocationService', () => {
  let service: GeolocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GeolocationService],
    });
    service = TestBed.inject(GeolocationService);
  });

  it('debe crearse exitosamente el servicio GeolocationService', () => {
    expect(service).toBeTruthy();
  });

  it('debe inicializarse con rastro vacío y GPS no activo', () => {
    expect(service.currentPosition()).toBeNull();
    expect(service.pathHistory().length).toBe(0);
    expect(service.totalDistanceMeters()).toBe(0);
    expect(service.isTracking()).toBe(false);
  });

  it('debe calcular con precisión la distancia Haversine entre dos coordenadas', () => {
    // Coordenadas conocidas: Parque Kennedy a Malecón de Miraflores (~1.1 km)
    const parqueKennedy: GeoCoordinates = { lat: -12.1221, lng: -77.0305 };
    const malecon: GeoCoordinates = { lat: -12.1315, lng: -77.0322 };

    const distance = service.calculateDistance(parqueKennedy, malecon);
    // Debe estar en el orden de ~1000 a 1200 metros
    expect(distance).toBeGreaterThan(900);
    expect(distance).toBeLessThan(1300);
  });

  it('debe reiniciar el rastro y distancia al invocar resetPath()', () => {
    service.resetPath();
    expect(service.pathHistory().length).toBe(0);
    expect(service.totalDistanceMeters()).toBe(0);
  });

  it('debe detener el rastreo y actualizar el estado al llamar stopTracking()', () => {
    service.stopTracking();
    expect(service.isTracking()).toBe(false);
    expect(service.statusMessage()).toContain('pausado');
  });
});
