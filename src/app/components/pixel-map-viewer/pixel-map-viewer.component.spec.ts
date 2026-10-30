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
    component.blockSize.set(8);
    expect(component.blockSize()).toBe(8);
  });

  it('debe alternar la visibilidad de los rótulos de calles legibles', () => {
    const initial = component.showStreetLabels();
    component.showStreetLabels.set(!initial);
    expect(component.showStreetLabels()).toBe(!initial);
  });

  it('debe alternar la cuantización de paleta', () => {
    const initial = component.quantizePalette();
    component.quantizePalette.set(!initial);
    expect(component.quantizePalette()).toBe(!initial);
  });

  it('debe alternar la cuadrícula voxel', () => {
    const initial = component.showGrid();
    component.showGrid.set(!initial);
    expect(component.showGrid()).toBe(!initial);
  });

  it('debe permitir cambiar la variante de mapa limpio', () => {
    component.mapVariant.set('clean_contrast');
    expect(component.mapVariant()).toBe('clean_contrast');
  });

  it('debe alternar el modo de renderizado entre google-maps y geometric-primitives', () => {
    component.renderMode.set('geometric-primitives');
    expect(component.renderMode()).toBe('geometric-primitives');
    component.renderMode.set('google-maps-raster');
    expect(component.renderMode()).toBe('google-maps-raster');
  });

  it('debe tener Huancayo configurado como ciudad inicial por defecto', () => {
    expect(component.currentCity().id).toBe('huancayo');
    expect(component.currentCity().name).toBe('Huancayo');
  });
});
