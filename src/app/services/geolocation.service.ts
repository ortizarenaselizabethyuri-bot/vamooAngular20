import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment.js';

/**
 * Coordenadas geográficas estándar (latitud y longitud).
 */
export interface GeoCoordinates {
  /** Latitud en grados decimales */
  lat: number;
  /** Longitud en grados decimales */
  lng: number;
}

/**
 * Lugar de interés detectado por la integración con Places API (parque, tienda aliada, etc.).
 */
export interface NearbyPlace {
  /** Identificador único del lugar en Google Places */
  placeId: string;
  /** Nombre del establecimiento o área verde */
  name: string;
  /** Tipo de lugar (ej. 'park', 'cafe', 'store') */
  type: string;
  /** Coordenadas geográficas del lugar */
  location: GeoCoordinates;
  /** Dirección formateada o referencia */
  address?: string;
  /** Calificación de Google (1 a 5 estrellas) */
  rating?: number;
  /** Distancia aproximada en metros respecto al aventurero */
  distanceMeters?: number;
}

/**
 * Servicio de Geolocalización y Conexión con Google Maps Platform (GeolocationService).
 *
 * Propósito: Gestionar el rastreo satelital del usuario en tiempo real mediante el GPS
 * del dispositivo (navigator.geolocation.watchPosition), registrar el historial de desplazamiento
 * para trazar senderos interactivos, cargar dinámicamente la API de Google Maps con Places Library
 * y consultar puntos de interés cercanos (parques y locales aliados).
 */
@Injectable({
  providedIn: 'root',
})
export class GeolocationService {
  /** Ubicación geográfica actual del aventurero en tiempo real */
  readonly currentPosition = signal<GeoCoordinates | null>(null);

  /** Historial ordenado de coordenadas recorridas en la sesión activa (sendero/polyline) */
  readonly pathHistory = signal<GeoCoordinates[]>([]);

  /** Distancia total recorrida en metros durante la caminata activa */
  readonly totalDistanceMeters = signal<number>(0);

  /** Estado de disponibilidad y permisos de la geolocalización */
  readonly isTracking = signal<boolean>(false);

  /** Mensaje de estado o diagnóstico del GPS */
  readonly statusMessage = signal<string>('GPS inactivo. Esperando activación de expedición.');

  /** Lugares de interés cercanos detectados alrededor de la posición actual */
  readonly nearbyPlaces = signal<NearbyPlace[]>([]);

  /** Indicador de si el script de Google Maps JavaScript API ha sido cargado en el DOM */
  readonly isGoogleMapsLoaded = signal<boolean>(false);

  /** Identificador del observador continuo de posición (watchPosition) */
  private watchId: number | null = null;

  /** Promesa de carga única del SDK de Google Maps para evitar inyecciones duplicadas */
  private mapsLoadPromise: Promise<void> | null = null;

  /**
   * Carga dinámicamente o verifica la disponibilidad del SDK de Google Maps JavaScript API.
   *
   * Propósito: Asegurar que `window.google.maps.Map` y `google.maps.importLibrary` estén
   * completamente inicializados antes de renderizar los componentes del mapa en Angular,
   * eliminando errores `TypeError: google.maps.importLibrary is not a function`
   * en recargas directas del navegador (F5 / navegación directa).
   *
   * @returns Promise<void> Resuelve cuando window.google.maps.Map está listo para instanciarse.
   */
  loadGoogleMapsApi(): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.resolve();
    }

    const g = (window as any).google;
    if (g?.maps?.Map) {
      this.isGoogleMapsLoaded.set(true);
      return Promise.resolve();
    }

    if (this.mapsLoadPromise) {
      return this.mapsLoadPromise;
    }

    this.mapsLoadPromise = new Promise<void>((resolve, reject) => {
      const checkReady = (): boolean => {
        const googleObj = (window as any).google;
        if (googleObj?.maps?.Map) {
          this.isGoogleMapsLoaded.set(true);
          this.statusMessage.set('Google Maps Platform y Places API cargados exitosamente.');
          resolve();
          return true;
        }
        return false;
      };

      if (checkReady()) {
        return;
      }

      // Si google.maps.importLibrary está disponible (del bootstrap loader en index.html), solicitar librerías
      if (g?.maps?.importLibrary) {
        Promise.all([
          g.maps.importLibrary('maps'),
          g.maps.importLibrary('places'),
          g.maps.importLibrary('core'),
        ])
          .then(() => {
            checkReady();
          })
          .catch((err) => {
            console.warn('Advertencia al importar librerías de Google Maps:', err);
          });
      }

      // Intervalo de sondeo rápido para detectar la inicialización interna
      const pollInterval = setInterval(() => {
        if (checkReady()) {
          clearInterval(pollInterval);
        }
      }, 40);

      // Temporizador de rescate por si la conexión o API Key fallan
      setTimeout(() => {
        clearInterval(pollInterval);
        if (!checkReady()) {
          this.statusMessage.set('Error o tiempo de espera agotado al conectar con Google Maps Platform.');
          reject(new Error('Google Maps Platform timeout'));
        }
      }, 15000);
    });

    return this.mapsLoadPromise;
  }

  /**
   * Inicia el rastreo continuo de la ubicación del aventurero en tiempo real (GPS).
   *
   * Propósito: Solicitar un fix inmediato de máxima precisión sin caché previa
   * (navigator.geolocation.getCurrentPosition) y activar el observador continuo
   * (navigator.geolocation.watchPosition) para mantener la posición satelital del usuario
   * actualizada en tiempo real sin requerir acciones manuales ni centrado tardío.
   *
   * @returns void
   */
  startTracking(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.statusMessage.set('La geolocalización satelital no es compatible con este navegador.');
      return;
    }

    if (this.watchId !== null) {
      return;
    }

    this.isTracking.set(true);
    this.statusMessage.set('Buscando señal satelital GPS...');

    // 1. Solicitar fix inmediato con máxima precisión y sin caché previa (tiempo real)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const freshCoords: GeoCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        this.currentPosition.set(freshCoords);
        if (this.pathHistory().length === 0) {
          this.pathHistory.set([freshCoords]);
        }
        this.statusMessage.set(
          `GPS activo en tiempo real: [${freshCoords.lat.toFixed(5)}, ${freshCoords.lng.toFixed(5)}]`,
        );
      },
      (error) => {
        console.warn('Aviso al solicitar posición inicial inmediata:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );

    // 2. Observación continua para alimentar el sendero y registrar movimiento
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newCoords: GeoCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        const previousCoords = this.currentPosition();
        if (previousCoords) {
          const deltaMeters = this.calculateDistance(previousCoords, newCoords);
          // Filtro para evitar ruido de lectura (micro movimientos < 1 metro)
          if (deltaMeters >= 1) {
            this.totalDistanceMeters.update((total) => Math.round(total + deltaMeters));
            this.pathHistory.update((path) => [...path, newCoords]);
          }
        } else {
          this.pathHistory.set([newCoords]);
        }

        this.currentPosition.set(newCoords);
        this.statusMessage.set(
          `GPS activo en tiempo real: [${newCoords.lat.toFixed(5)}, ${newCoords.lng.toFixed(5)}]`,
        );
      },
      (error) => {
        this.isTracking.set(false);
        this.watchId = null;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.statusMessage.set('Permiso de geolocalización denegado por el usuario.');
            break;
          case error.POSITION_UNAVAILABLE:
            this.statusMessage.set('Señal satelital no disponible actualmente.');
            break;
          case error.TIMEOUT:
            this.statusMessage.set('Tiempo de espera agotado al consultar el GPS.');
            break;
          default:
            this.statusMessage.set('Error desconocido al obtener la posición satelital.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 2000,
      },
    );
  }

  /**
   * Detiene el rastreo continuo del GPS.
   *
   * Propósito: Liberar el receptor satelital del dispositivo para conservar batería.
   *
   * @returns void
   */
  stopTracking(): void {
    if (this.watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking.set(false);
    this.statusMessage.set('Rastreo GPS pausado.');
  }

  /**
   * Registra manualmente o por evento una nueva coordenada del aventurero.
   *
   * Propósito: Calcular el incremento de distancia mediante Haversine, actualizar el
   * historial de coordenadas para el sendero polyline y sincronizar la posición actual.
   *
   * @param newCoords - Nuevas coordenadas geográficas (lat, lng).
   * @returns void
   */
  recordLocation(newCoords: GeoCoordinates): void {
    const previousCoords = this.currentPosition();
    if (previousCoords) {
      const deltaMeters = this.calculateDistance(previousCoords, newCoords);
      if (deltaMeters >= 0.5) {
        this.totalDistanceMeters.update((total) => Math.round(total + deltaMeters));
        this.pathHistory.update((path) => [...path, newCoords]);
      }
    } else {
      this.pathHistory.set([newCoords]);
    }

    this.currentPosition.set(newCoords);
    this.statusMessage.set(
      `GPS activo. Coordenadas: [${newCoords.lat.toFixed(5)}, ${newCoords.lng.toFixed(5)}]`,
    );
  }

  /**
   * Simula un paso de caminata de avance (~35 metros) en dirección del sendero.
   *
   * Propósito: Permitir a los usuarios en equipos de escritorio probar la animación del mapa,
   * el trazado de la polilínea y el incremento de distancia/XP sin requerir desplazamiento físico.
   *
   * @returns void
   */
  simulateWalkStep(): void {
    const current = this.currentPosition() || { lat: -12.0681, lng: -75.2100 };
    // Pequeño desplazamiento en diagonal hacia el este/norte (~35 metros)
    const stepLat = current.lat + (Math.random() * 0.0003 - 0.0001);
    const stepLng = current.lng + 0.0003;
    const nextCoords: GeoCoordinates = { lat: stepLat, lng: stepLng };

    this.recordLocation(nextCoords);
    this.statusMessage.set(`Paso simulado registrado: +35 m aproximados.`);
  }

  /**
   * Reinicia el recorrido acumulado y el contador de distancia.
   *
   * @returns void
   */
  resetPath(): void {
    this.pathHistory.set([]);
    this.totalDistanceMeters.set(0);
    this.statusMessage.set('Sendero reiniciado.');
  }

  /**
   * Busca lugares de interés cercanos (parques, cafeterías, tiendas) usando PlacesService de Google Maps.
   *
   * Propósito: Encontrar los puntos gamificados de la fauna silvestre y locales aliados
   * en el radio alrededor de las coordenadas del usuario.
   *
   * @param mapInstance - Instancia activa de google.maps.Map sobre la cual consultar.
   * @param radiusMeters - Radio de búsqueda en metros (por defecto 1500 m).
   * @param placeType - Tipo de establecimiento ('park', 'cafe', 'store', etc.).
   * @returns Promise<NearbyPlace[]> Lista de lugares encontrados con nombre y coordenadas.
   */
  searchNearbyPlaces(
    mapInstance: any,
    radiusMeters: number = 1500,
    placeType: string = 'park',
  ): Promise<NearbyPlace[]> {
    return new Promise((resolve) => {
      const position = this.currentPosition();
      if (!position || typeof window === 'undefined' || !(window as any).google?.maps?.places) {
        resolve([]);
        return;
      }

      const googleMaps = (window as any).google.maps;
      const service = new googleMaps.places.PlacesService(mapInstance);

      const request = {
        location: new googleMaps.LatLng(position.lat, position.lng),
        radius: radiusMeters,
        type: placeType,
      };

      service.nearbySearch(request, (results: any[], status: any) => {
        if (status === googleMaps.places.PlacesServiceStatus.OK && results) {
          const places: NearbyPlace[] = results.map((item) => {
            const loc: GeoCoordinates = {
              lat: item.geometry.location.lat(),
              lng: item.geometry.location.lng(),
            };
            return {
              placeId: item.place_id,
              name: item.name,
              type: placeType,
              location: loc,
              address: item.vicinity,
              rating: item.rating,
              distanceMeters: Math.round(this.calculateDistance(position, loc)),
            };
          });

          this.nearbyPlaces.set(places);
          resolve(places);
        } else {
          resolve([]);
        }
      });
    });
  }

  /**
   * Calcula la distancia geodésica en metros entre dos puntos geográficos mediante la fórmula del Haversine.
   *
   * Propósito: Estimar con precisión métrica la distancia caminada sin requerir llamadas externas a APIs.
   *
   * @param coord1 - Coordenada de origen (latitud, longitud).
   * @param coord2 - Coordenada de destino (latitud, longitud).
   * @returns number Distancia en metros entre ambos puntos.
   */
  calculateDistance(coord1: GeoCoordinates, coord2: GeoCoordinates): number {
    const earthRadiusMeters = 6371000;
    const dLat = this.degreesToRadians(coord2.lat - coord1.lat);
    const dLng = this.degreesToRadians(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(coord1.lat)) *
        Math.cos(this.degreesToRadians(coord2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMeters * c;
  }

  /**
   * Convierte un valor de grados decimales a radianes.
   *
   * @param degrees - Valor en grados decimales.
   * @returns number Valor equivalente en radianes.
   */
  private degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
