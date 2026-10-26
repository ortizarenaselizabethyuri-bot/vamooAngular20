import { TestBed } from '@angular/core/testing';
import { MapboxService } from './mapbox.service.js';

describe('MapboxService', () => {
  let service: MapboxService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MapboxService],
    });
    service = TestBed.inject(MapboxService);
  });

  it('debe instanciarse correctamente el servicio MapboxService', () => {
    expect(service).toBeTruthy();
  });

  it('debe inicializarse con isReady en false', () => {
    expect(service.isReady()).toBe(false);
  });

  it('debe proveer un access token de Mapbox', () => {
    const token = service.getAccessToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('debe liberar recursos correctamente al invocar destroyMap()', () => {
    service.destroyMap();
    expect(service.isReady()).toBe(false);
  });
});
