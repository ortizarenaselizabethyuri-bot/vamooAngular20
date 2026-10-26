import { Injectable, signal } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../environments/environment.js';
import { GeoCoordinates } from './geolocation.service.js';
import { createPixelPlayerMarkerElement, MAPBOX_PIXEL_THEME } from '../pages/jugar/mapbox-pixel-theme.js';

/**
 * Servicio de integración y gestión de Mapbox GL JS (MapboxService).
 *
 * Propósito: Gestionar la inicialización del motor cartográfico WebGL de Mapbox,
 * renderizar capas con estética pixel-art/aventura, sincronizar la posición GPS
 * del explorador con marcadores animados retro y trazar senderos GeoJSON en tiempo real.
 */
@Injectable({
  providedIn: 'root',
})
export class MapboxService {
  /** Instancia activa del mapa Mapbox GL */
  private mapInstance: mapboxgl.Map | null = null;

  /** Marcador del jugador en Mapbox */
  private playerMarker: mapboxgl.Marker | null = null;

  /** Identificador de la fuente GeoJSON del sendero */
  private readonly PATH_SOURCE_ID = 'expedition-trail-source';

  /** Identificador de la capa de línea del sendero */
  private readonly PATH_LAYER_ID = 'expedition-trail-layer';

  /** Estado de inicialización del mapa */
  readonly isReady = signal<boolean>(false);

  /**
   * Obtiene el token de Mapbox configurado en los entornos o uno de respaldo.
   *
   * @returns Token de acceso de Mapbox.
   */
  getAccessToken(): string {
    return (
      (environment as any).mapboxToken ||
      'pk.eyJ1IjoiYWR2ZW50dXJldmFtb28iLCJhIjoiY203M3g3bDFjMDcxZDJtcXVobnIwc2p5NCJ9.demo_token'
    );
  }

  /**
   * Inicializa un nuevo mapa Mapbox GL dentro del contenedor HTML especificado.
   *
   * @param container - Elemento contenedor HTML o su ID.
   * @param initialCoords - Coordenadas iniciales de cámara.
   * @param initialZoom - Nivel de zoom inicial (por defecto 15).
   * @returns Instancia de mapboxgl.Map.
   */
  initializeMap(
    container: HTMLElement | string,
    initialCoords: GeoCoordinates = { lat: -12.1217, lng: -77.0305 },
    initialZoom: number = 15
  ): mapboxgl.Map {
    mapboxgl.accessToken = this.getAccessToken();

    this.mapInstance = new mapboxgl.Map({
      container,
      style: MAPBOX_PIXEL_THEME.styleUrl,
      center: [initialCoords.lng, initialCoords.lat],
      zoom: initialZoom,
      attributionControl: true,
    });

    this.mapInstance.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    this.mapInstance.on('load', () => {
      this.setupTrailLayer();
      this.isReady.set(true);
    });

    return this.mapInstance;
  }

  /**
   * Configura la fuente GeoJSON y la capa de línea para el sendero de expedición.
   *
   * @returns void
   */
  private setupTrailLayer(): void {
    if (!this.mapInstance) return;

    if (!this.mapInstance.getSource(this.PATH_SOURCE_ID)) {
      this.mapInstance.addSource(this.PATH_SOURCE_ID, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        },
      });

      this.mapInstance.addLayer({
        id: this.PATH_LAYER_ID,
        type: 'line',
        source: this.PATH_SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#f59e0b',
          'line-width': 6,
          'line-opacity': 0.9,
        },
      });
    }
  }

  /**
   * Actualiza las coordenadas del sendero recorrido en la capa de línea GeoJSON.
   *
   * @param coordinates - Arreglo de coordenadas GPS del sendero.
   * @returns void
   */
  updateTrailCoordinates(coordinates: GeoCoordinates[]): void {
    if (!this.mapInstance || !this.mapInstance.getSource(this.PATH_SOURCE_ID)) return;

    const source = this.mapInstance.getSource(this.PATH_SOURCE_ID) as mapboxgl.GeoJSONSource;
    const lineCoords = coordinates.map((c) => [c.lng, c.lat]);

    source.setData({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: lineCoords,
      },
    });
  }

  /**
   * Actualiza la posición del marcador del aventurero en el mapa.
   *
   * @param coords - Coordenadas actuales del aventurero.
   * @param emoji - Emoji o avatar del aventurero.
   * @returns void
   */
  updatePlayerMarker(coords: GeoCoordinates, emoji: string = '🦊'): void {
    if (!this.mapInstance) return;

    if (!this.playerMarker) {
      const el = createPixelPlayerMarkerElement(emoji);
      this.playerMarker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([coords.lng, coords.lat])
        .addTo(this.mapInstance);
    } else {
      this.playerMarker.setLngLat([coords.lng, coords.lat]);
    }
  }

  /**
   * Centra suavemente la cámara del mapa en las coordenadas indicadas.
   *
   * @param coords - Coordenadas de destino.
   * @param zoom - Nivel de zoom opcional.
   * @returns void
   */
  flyToCoordinates(coords: GeoCoordinates, zoom?: number): void {
    if (!this.mapInstance) return;

    this.mapInstance.flyTo({
      center: [coords.lng, coords.lat],
      zoom: zoom ?? this.mapInstance.getZoom(),
      speed: 1.2,
      curve: 1.4,
      essential: true,
    });
  }

  /**
   * Destruye la instancia del mapa y libera recursos WebGL.
   *
   * @returns void
   */
  destroyMap(): void {
    if (this.playerMarker) {
      this.playerMarker.remove();
      this.playerMarker = null;
    }
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
    this.isReady.set(false);
  }
}
