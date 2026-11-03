import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { JugarComponent } from './jugar.component.js';

describe('JugarComponent', () => {
  let component: JugarComponent;
  let fixture: ComponentFixture<JugarComponent>;
  let router: Router;

  beforeEach(async () => {
    const mockGeolocation = {
      watchPosition: vi.fn().mockReturnValue(123),
      clearWatch: vi.fn(),
      getCurrentPosition: vi.fn(),
    };
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });

    await TestBed.configureTestingModule({
      imports: [JugarComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JugarComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('debe crearse exitosamente el componente JugarComponent', () => {
    expect(component).toBeTruthy();
  });

  it('debe renderizar el título de Zona de Juego y los modos configurados', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('ZONA DE JUEGO');
    expect(component.gameModes.length).toBeGreaterThanOrEqual(3);
  });

  it('debe inicializarse en la pestaña de mapa interactivo y con estilos Pixar', () => {
    expect(component.activeTab()).toBe('mapa');
    expect(component.mapOptions.styles).toBeDefined();
    expect(component.mapCenter().lat).toBeCloseTo(-12.0681, 2);
  });

  it('debe alternar entre pestañas de mapa y modalidades', () => {
    component.setActiveTab('modos');
    expect(component.activeTab()).toBe('modos');

    component.setActiveTab('mapa');
    expect(component.activeTab()).toBe('mapa');
  });

  it('debe permitir seleccionar y deseleccionar un modo de juego', () => {
    const primerModo = component.gameModes[0];
    component.selectMode(primerModo);
    expect(component.selectedMode?.id).toBe(primerModo.id);

    // Deseleccionar al hacer clic nuevamente
    component.selectMode(primerModo);
    expect(component.selectedMode).toBeNull();
  });

  it('debe simular validación por código QR para locales aliados', () => {
    const modoQr = component.gameModes.find((m) => m.id === 'locales-aliados-qr')!;
    component.simulateValidation(modoQr);

    expect(component.simulationState).toBeTruthy();
    expect(component.simulationState?.validationMethod).toBe('QR');
    expect(component.simulationState?.xpEarned).toBe(50);
  });

  it('debe simular validación por GPS para rutas ecológicas y permitir cerrar alerta', () => {
    const modoRuta = component.gameModes.find((m) => m.id === 'rutas-predeterminadas')!;
    component.simulateValidation(modoRuta);

    expect(component.simulationState).toBeTruthy();
    expect(component.simulationState?.validationMethod).toBe('GPS');
    expect(component.simulationState?.xpEarned).toBe(100);

    component.closeSimulation();
    expect(component.simulationState).toBeNull();
  });

  it('debe navegar hacia /login al hacer clic en el enlace de acceso', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.goToLogin();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('debe gestionar el inicio, pausa y simulación de pasos en la expedición (Etapa 2)', () => {
    // Al inicializarse con ngOnInit() ya inicia el rastreo GPS en vivo
    expect(component.geoService.isTracking()).toBe(true);

    // Pausar expedición
    component.toggleTracking();
    expect(component.geoService.isTracking()).toBe(false);

    // Reanudar expedición
    component.toggleTracking();
    expect(component.geoService.isTracking()).toBe(true);

    // Simular paso de avance (+35m)
    component.simulateStep();
    expect(component.polylinePath().length).toBeGreaterThan(0);
    expect(component.geoService.totalDistanceMeters()).toBeGreaterThanOrEqual(0);

    // Pausar expedición nuevamente
    component.toggleTracking();
    expect(component.geoService.isTracking()).toBe(false);

    // Reiniciar expedición
    component.resetExpedition();
    expect(component.polylinePath().length).toBe(0);
    expect(component.geoService.totalDistanceMeters()).toBe(0);
  });

  it('debe calcular métricas de distancia y XP estimado de caminata (+15 XP/km)', () => {
    // Si la distancia es 0 m
    expect(component.formattedDistance()).toBe('0 m');
    expect(component.currentExpeditionXp()).toBe(0);

    // Simular registro de posición con incremento
    component.geoService.recordLocation({ lat: -12.1217, lng: -77.0305 });
    component.geoService.recordLocation({ lat: -12.1317, lng: -77.0305 }); // ~1.1 km de distancia

    expect(component.geoService.totalDistanceMeters()).toBeGreaterThan(1000);
    expect(component.formattedDistance()).toContain('km');
    expect(component.currentExpeditionXp()).toBeGreaterThanOrEqual(15);
  });

  it('debe gestionar los puntos de interés cercanos (POIs) y permitir filtrado y selección', () => {
    expect(component.nearbyPois().length).toBeGreaterThanOrEqual(5);

    // Filtrar por boticas
    component.filterPoiCategory('pharmacy');
    expect(component.activePoiCategory()).toBe('pharmacy');
    expect(component.filteredPois().every((p) => p.category === 'pharmacy')).toBe(true);

    // Seleccionar un POI
    const poi = component.nearbyPois()[0];
    component.selectPoi(poi);
    expect(component.selectedPoi()?.id).toBe(poi.id);
    expect(component.autoFollow()).toBe(false);
    expect(component.mapCenter().lat).toBe(poi.coords.lat);

    // Cerrar selección
    component.clearSelectedPoi();
    expect(component.selectedPoi()).toBeNull();

    // Restablecer todas las categorías
    component.filterPoiCategory('all');
    expect(component.filteredPois().length).toBe(component.nearbyPois().length);
  });

  it('debe actualizar reactivamente los POIs cercanos cuando la ubicación del usuario cambia', () => {
    // Al ubicarse en el centro de Huancayo
    component.updateNearbyPoisForLocation({ lat: -12.0681, lng: -75.2100 }, true);
    const poisCentro = component.nearbyPois();
    expect(poisCentro.length).toBeGreaterThan(0);

    // Al desplazarse hacia El Tambo (~2.5km al norte)
    component.updateNearbyPoisForLocation({ lat: -12.0482, lng: -75.2215 }, true);
    const poisTambo = component.nearbyPois();
    expect(poisTambo.length).toBeGreaterThan(0);

    // Los lugares cercanos en El Tambo deben ser distintos a los del Centro
    expect(poisTambo[0].id).not.toBe(poisCentro[0].id);
    expect(poisTambo.some((p) => p.name.includes('El Tambo') || p.name.includes('Castilla'))).toBe(true);
  });
});
