/**
 * @fileoverview Pruebas unitarias para PixelMapViewerComponent.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PixelMapViewerComponent } from './pixel-map-viewer.component.js';

describe('PixelMapViewerComponent', () => {
  let component: PixelMapViewerComponent;
  let fixture: ComponentFixture<PixelMapViewerComponent>;

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
      imports: [PixelMapViewerComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(PixelMapViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse exitosamente el componente PixelMapViewerComponent', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializarse con el bloque atómico estándar de 5px', () => {
    expect(component.blockSize()).toBe(5);
  });

  it('debe permitir cambiar el tamaño de bloque atómico', () => {
    component.setBlockSize(8);
    expect(component.blockSize()).toBe(8);
  });

  it('debe alternar la visibilidad de los rótulos de calles legibles', () => {
    const initial = component.showStreetLabels();
    component.toggleStreetLabels();
    expect(component.showStreetLabels()).toBe(!initial);
  });

  it('debe alternar la cuantización de paleta', () => {
    const initial = component.quantizePalette();
    component.toggleQuantize();
    expect(component.quantizePalette()).toBe(!initial);
  });

  it('debe alternar la cuadrícula voxel', () => {
    const initial = component.showGrid();
    component.toggleGrid();
    expect(component.showGrid()).toBe(!initial);
  });

  it('debe permitir cambiar la variante de mapa limpio', () => {
    component.setMapVariant('clean_contrast');
    expect(component.mapVariant()).toBe('clean_contrast');
    expect(component.currentImageUrl()).toBe('/google_maps_clean_contrast.png');
  });

  it('debe alternar el modo de renderizado entre google-maps y geometric-primitives', () => {
    component.setRenderMode('geometric-primitives');
    expect(component.renderMode()).toBe('geometric-primitives');
    component.setRenderMode('google-maps-raster');
    expect(component.renderMode()).toBe('google-maps-raster');
  });

  it('debe inicializar el avatar con posición por defecto y permitir avanzar pasos', () => {
    const initialPos = component.avatarPosition();
    expect(initialPos.x).toBe(38);
    expect(initialPos.y).toBe(56);
    expect(component.expeditionDistance()).toBe(0);

    component.advanceStep();
    expect(component.expeditionDistance()).toBe(35);
    expect(component.expeditionXp()).toBe(5);
    expect(component.avatarTrail().length).toBe(2);
  });

  it('debe reiniciar el rastro de expedición y restaurar la posición inicial', () => {
    component.advanceStep();
    component.advanceStep();
    expect(component.expeditionDistance()).toBe(70);

    component.resetExpedition();
    expect(component.expeditionDistance()).toBe(0);
    expect(component.expeditionXp()).toBe(0);
    expect(component.avatarPosition().x).toBe(38);
    expect(component.avatarPosition().y).toBe(56);
  });
});
