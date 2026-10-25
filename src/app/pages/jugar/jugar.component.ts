import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GoogleMap, MapMarker, MapPolyline, MapCircle } from '@angular/google-maps';
import { GeolocationService, GeoCoordinates } from '../../services/geolocation.service.js';
import { AuthService } from '../../services/auth.service.js';
import { PIXAR_MAP_THEME } from './pixar-map-theme.js';

/**
 * Interfaz que define un modo de expedición o juego en Vamoo,
 * alineado a las entidades Route, UserActivity y reglas de bonificación del backend.
 */
export interface GameMode {
  /** Identificador único del modo */
  id: string;
  /** Título descriptivo en estilo pixel-art */
  title: string;
  /** Resumen de la mecánica de exploración */
  description: string;
  /** Emoji o icono pixel representativo */
  icon: string;
  /** Grado de exigencia física o tiempo mínimo */
  difficulty: 'Fácil' | 'Media' | 'Difícil' | 'Especial';
  /** Estado de disponibilidad en el ciclo actual */
  status: 'Disponible' | 'Edición Limitada' | 'Bonus Activo' | 'Próximamente';
  /** Recompensa de experiencia (XP) otorgada */
  xpReward: string;
  /** Mecanismo de auditoría técnica (GPS / QR / Grupo) */
  validationType: 'GPS (10 min)' | 'Escaneo QR' | 'GPS + Trofeo' | 'Multiplicador';
  /** Detalle expandido con los requerimientos técnicos del backend */
  detail: string;
}

/**
 * Modelo para el estado de la simulación de validación de ruta.
 */
export interface RouteSimulationState {
  /** Indica si la simulación está activa */
  isActive: boolean;
  /** Mensaje informativo con el resultado del chequeo */
  message: string;
  /** Cantidad de XP acreditada en la simulación */
  xpEarned: number;
  /** Tipo de validación ejecutada */
  validationMethod: 'GPS' | 'QR' | 'GRUPO';
}

/**
 * Componente principal de la sección Jugar (JugarComponent).
 *
 * Propósito: Ofrecer al aventurero el mapa interactivo con estética visual "Pixar Aventura",
 * seguimiento satelital GPS en tiempo real con marcador animado y trazado de sendero polyline,
 * telemetría en vivo de distancia/XP y alternancia con el catálogo de expediciones.
 */
@Component({
  selector: 'app-jugar',
  standalone: true,
  imports: [CommonModule, GoogleMap, MapMarker, MapPolyline, MapCircle],
  templateUrl: './jugar.component.html',
  styleUrl: './jugar.component.css',
})
export class JugarComponent implements OnInit {
  /** Servicio de enrutamiento y navegación */
  private readonly router = inject(Router);

  /** Servicio de geolocalización satelital y Google Maps Platform */
  readonly geoService = inject(GeolocationService);

  /** Servicio de autenticación para consultar perfil y rango del aventurero */
  readonly authService = inject(AuthService);

  /** Pestaña activa en la interfaz ('mapa' interactivo o 'modos' de expedición) */
  readonly activeTab = signal<'mapa' | 'modos'>('mapa');

  /** Coordenadas centrales del mapa (por defecto Parque Kennedy, Miraflores - Lima) */
  readonly mapCenter = signal<GeoCoordinates>({
    lat: -12.1217,
    lng: -77.0305,
  });

  /** Nivel de zoom de aventura del mapa */
  readonly mapZoom = signal<number>(16);

  /** Estado de inicialización del mapa */
  readonly isMapReady = signal<boolean>(false);

  /** Control para seguimiento automático de cámara al caminar */
  readonly autoFollow = signal<boolean>(true);

  /** Control para alternar la textura pixelada en áreas verdes (parques y reservas) */
  readonly isGreenTextureActive = signal<boolean>(true);

  /** Opciones de personalización de Google Maps con el tema Pixar Aventura */
  readonly mapOptions: google.maps.MapOptions = {
    styles: PIXAR_MAP_THEME,
    disableDefaultUI: false,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
    clickableIcons: false,
    gestureHandling: 'greedy',
    maxZoom: 19,
    minZoom: 12,
  };

  /** Opciones de estilo para el sendero de expedición (Polyline Pixar) */
  readonly polylineOptions: google.maps.PolylineOptions = {
    strokeColor: '#f59e0b',
    strokeOpacity: 0.95,
    strokeWeight: 5,
    geodesic: true,
  };

  /** Opciones para el halo satelital de precisión del GPS */
  readonly accuracyCircleOptions: google.maps.CircleOptions = {
    fillColor: '#10b981',
    fillOpacity: 0.2,
    strokeColor: '#059669',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    radius: 25,
  };

  /** Posición actual del aventurero reactiva */
  readonly userCoords = computed(() => this.geoService.currentPosition());

  /** Historial ordenado de coordenadas del sendero caminado */
  readonly polylinePath = computed(() => this.geoService.pathHistory());

  /** Distancia total formateada en kilómetros o metros */
  readonly formattedDistance = computed(() => {
    const meters = this.geoService.totalDistanceMeters();
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters} m`;
  });

  /** Puntos de experiencia (XP) estimados para la caminata actual (+15 XP por km) */
  readonly currentExpeditionXp = computed(() => {
    const km = this.geoService.totalDistanceMeters() / 1000;
    return Math.floor(km * 15);
  });

  /** Emoji de fauna correspondiente al rango del aventurero */
  readonly rankEmoji = computed(() => {
    const user = this.authService.currentUser();
    const rank = user?.currentRank || 'Pichón';
    return this.getFaunaEmoji(rank);
  });

  /** Opciones de marcador animado para el avatar del aventurero */
  readonly adventurerMarkerOptions = computed<google.maps.MarkerOptions | null>(() => {
    const coords = this.userCoords();
    if (!coords || typeof window === 'undefined' || !(window as any).google?.maps) {
      return null;
    }

    const emoji = this.rankEmoji();
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.6"/>
          </filter>
        </defs>
        <circle cx="28" cy="28" r="24" fill="#10b981" stroke="#ffffff" stroke-width="3" filter="url(#shadow)"/>
        <circle cx="28" cy="28" r="20" fill="#064e3b" stroke="#facc15" stroke-width="2"/>
        <text x="28" y="32" font-size="22" text-anchor="middle" dominant-baseline="central">${emoji}</text>
      </svg>
    `;

    const googleMaps = (window as any).google.maps;
    return {
      position: coords,
      title: `Aventurero: ${this.authService.currentUser()?.name || 'Explorador Vamoo'}`,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon.trim()),
        scaledSize: new googleMaps.Size(48, 48),
        anchor: new googleMaps.Point(24, 24),
      },
      zIndex: 100,
    };
  });

  /**
   * Catálogo de hitos ecológicos y reservas de fauna/flora urbana
   * para enriquecer visualmente las áreas verdes en modo textura pixel-art.
   */
  readonly parkFloraMarkers = [
    { name: 'Parque Central de Miraflores', lat: -12.1215, lng: -77.0298, icon: '🌳' },
    { name: 'Parque 7 de Junio (Kennedy)', lat: -12.1223, lng: -77.0308, icon: '🌿' },
    { name: 'Parque del Amor (Malecón)', lat: -12.1250, lng: -77.0365, icon: '🌺' },
    { name: 'Santuario Patriótico Reducto N°2', lat: -12.1265, lng: -77.0225, icon: '🌲' },
    { name: 'Parque Salazar (Larcomar)', lat: -12.1315, lng: -77.0305, icon: '🌴' },
  ];

  /**
   * Colección de opciones de marcadores de flora ecológica para renderizado condicional en el mapa.
   *
   * Propósito: Mostrar iconos pixel-art de árboles y flores sobre los parques cuando la textura pixelada
   * está activa, ofreciendo una experiencia retro inmersiva inspirada en RPGs clásicos.
   */
  readonly parkFloraMarkerOptions = computed(() => {
    if (!this.isGreenTextureActive() || typeof window === 'undefined' || !(window as any).google?.maps) {
      return [];
    }
    const googleMaps = (window as any).google.maps;
    return this.parkFloraMarkers.map((park) => {
      const svgIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="#064e3b" stroke="#4ade80" stroke-width="2"/>
          <text x="18" y="23" font-size="16" text-anchor="middle">${park.icon}</text>
        </svg>
      `;
      return {
        position: { lat: park.lat, lng: park.lng },
        title: `Hito Verde: ${park.name}`,
        options: {
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon.trim()),
            scaledSize: new googleMaps.Size(32, 32),
            anchor: new googleMaps.Point(16, 16),
          },
          zIndex: 60,
        },
      };
    });
  });

  /** Catálogo de modos de expedición configurados a partir del backend de Vamoo */
  readonly gameModes: GameMode[] = [
    {
      id: 'rutas-predeterminadas',
      title: 'RUTAS ECOLÓGICAS',
      description: 'Recorre senderos y humedales protegidos con validación por GPS y tiempo de permanencia.',
      icon: '🗺️',
      difficulty: 'Fácil',
      status: 'Disponible',
      xpReward: '100 XP',
      validationType: 'GPS (10 min)',
      detail: 'Requiere permanencia mínima de 10 minutos y validación satelital en el radio de coordenadas GeoJSON.',
    },
    {
      id: 'locales-aliados-qr',
      title: 'LOCALES ALIADOS & QR',
      description: 'Descubre cafeterías y tiendas eco-sostenibles aliadas. Valida tu visita escaneando su código QR.',
      icon: '🏪',
      difficulty: 'Media',
      status: 'Disponible',
      xpReward: '50 - 100 XP',
      validationType: 'Escaneo QR',
      detail: 'Verificación instantánea con código alfanumérico único proporcionado por el establecimiento aliado.',
    },
    {
      id: 'eventos-temporada',
      title: 'FAUNA DE TEMPORADA',
      description: 'Eventos de edición limitada enfocados en avistamiento de especies migratorias e insignias conmemorativas.',
      icon: '🦩',
      difficulty: 'Difícil',
      status: 'Edición Limitada',
      xpReward: '150 XP',
      validationType: 'GPS + Trofeo',
      detail: 'Otorga un trofeo exclusivo coleccionable en tu perfil y 150 puntos para la liga semanal.',
    },
    {
      id: 'caminata-grupal',
      title: 'EXPEDICIÓN EN GRUPO',
      description: 'Sal a caminar en compañía de otros aventureros y activa la bonificación multiplicadora de experiencia.',
      icon: '👥',
      difficulty: 'Especial',
      status: 'Bonus Activo',
      xpReward: '+20% XP',
      validationType: 'Multiplicador',
      detail: 'El backend calcula automáticamente un bonus adicional del 20% al registrar salidas con amigos.',
    },
  ];

  /** Modo de juego seleccionado actualmente para inspección o simulación */
  selectedMode: GameMode | null = null;

  /** Estado de la simulación de ruta (GPS o QR) */
  simulationState: RouteSimulationState | null = null;

  /**
   * Ciclo de inicialización del componente.
   *
   * Propósito: Cargar la API de Google Maps Platform y comenzar rastreo si el usuario lo desea.
   *
   * @returns void
   */
  ngOnInit(): void {
    this.geoService
      .loadGoogleMapsApi()
      .then(() => {
        this.isMapReady.set(true);
        // Si no hay coordenadas previas, fijar coordenadas iniciales en Lima
        if (!this.geoService.currentPosition()) {
          this.geoService.recordLocation({ lat: -12.1217, lng: -77.0305 });
        }
      })
      .catch(() => {
        this.isMapReady.set(false);
      });
  }

  /**
   * Cambia la pestaña activa entre el mapa interactivo y los modos de juego.
   *
   * @param tab - Nombre de la pestaña seleccionada ('mapa' o 'modos').
   * @returns void
   */
  setActiveTab(tab: 'mapa' | 'modos'): void {
    this.activeTab.set(tab);
  }

  /**
   * Inicia o pausa el seguimiento del GPS satelital en tiempo real.
   *
   * @returns void
   */
  toggleTracking(): void {
    if (this.geoService.isTracking()) {
      this.geoService.stopTracking();
    } else {
      this.geoService.startTracking();
      this.autoFollow.set(true);
    }
  }

  /**
   * Simula un paso de caminata de 35 metros para comprobar el movimiento y trazo polyline.
   *
   * @returns void
   */
  simulateStep(): void {
    this.geoService.simulateWalkStep();
    const current = this.geoService.currentPosition();
    if (current && this.autoFollow()) {
      this.mapCenter.set(current);
    }
  }

  /**
   * Reinicia el sendero recorrido y pone a cero el contador de distancia.
   *
   * @returns void
   */
  resetExpedition(): void {
    this.geoService.resetPath();
  }

  /**
   * Alterna la aplicación de la textura pixelada retro sobre las áreas verdes del mapa.
   *
   * Propósito: Permitir al aventurero encender o apagar el shader / filtro pixel-art
   * que texturiza parques y áreas ecológicas con estética 8-bit / 16-bit.
   *
   * @returns void
   */
  toggleGreenTexture(): void {
    this.isGreenTextureActive.update((active) => !active);
  }

  /**
   * Centra la cámara del mapa en la ubicación satelital del aventurero.
   *
   * @returns void
   */
  centerOnUser(): void {
    const userPos = this.geoService.currentPosition();
    if (userPos) {
      this.mapCenter.set(userPos);
      this.mapZoom.set(16);
      this.autoFollow.set(true);
    } else {
      this.geoService.startTracking();
    }
  }

  /**
   * Retorna el emoji de fauna correspondiente a un rango del usuario.
   *
   * @param rank - Rango del usuario.
   * @returns string Emoji representativo de fauna.
   */
  private getFaunaEmoji(rank: string): string {
    const r = (rank || '').toLowerCase();
    if (r.includes('bagre')) return '🐟';
    if (r.includes('tortuga')) return '🐢';
    if (r.includes('oso')) return '🐻';
    if (r.includes('flamenco')) return '🦩';
    if (r.includes('pingüino') || r.includes('pinguino')) return '🐧';
    return '🐣';
  }

  /**
   * Selecciona o deselecciona un modo de juego para ver sus especificaciones técnicas.
   *
   * @param mode - Modo de juego a inspeccionar.
   * @returns void
   */
  selectMode(mode: GameMode): void {
    if (this.selectedMode?.id === mode.id) {
      this.selectedMode = null;
    } else {
      this.selectedMode = mode;
      this.simulationState = null;
    }
  }

  /**
   * Ejecuta una simulación interactiva de validación técnica (GPS o QR)
   * correspondiente al modo de juego seleccionado.
   *
   * @param mode - Modo de juego para el cual se ejecuta la simulación.
   * @returns void
   */
  simulateValidation(mode: GameMode): void {
    if (mode.id === 'locales-aliados-qr') {
      this.simulationState = {
        isActive: true,
        message: '¡Código QR "VAMOO-LOCAL-01" validado con éxito en Cafetería Aliada!',
        xpEarned: 50,
        validationMethod: 'QR',
      };
    } else if (mode.id === 'caminata-grupal') {
      this.simulationState = {
        isActive: true,
        message: '¡Compañero vinculado! Multiplicador +20% activado para tu siguiente salida.',
        xpEarned: 20,
        validationMethod: 'GRUPO',
      };
    } else {
      this.simulationState = {
        isActive: true,
        message: '¡Punto de ruta alcanzado [-77.0282, -12.2034]! Tiempo de 10 min confirmado por GPS.',
        xpEarned: mode.id === 'eventos-temporada' ? 150 : 100,
        validationMethod: 'GPS',
      };
    }
  }

  /**
   * Cierra el modal o banner de simulación de ruta activa.
   *
   * @returns void
   */
  closeSimulation(): void {
    this.simulationState = null;
  }

  /**
   * Navega hacia la pantalla de inicio de sesión.
   *
   * @returns void
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
