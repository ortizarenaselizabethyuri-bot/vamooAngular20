import { Injectable, signal, computed } from '@angular/core';
import { UserSession, LocationPermissionState, TutorialStep } from '../models/session.model';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  // Session State
  readonly session = signal<UserSession>({
    isAuthenticated: false,
    userId: 'usr_84920',
    username: 'ExploradorVamoo',
    email: 'explorador@vamoo.app',
    avatar: 'assets/mascot.jpg',
    rank: 'Pingüino',
    xp: 210,
    targetRank: 'Flamenco',
    targetRankXp: 200,
    tutorialCompleted: false,
    locationPermission: 'prompt',
    isSessionExpired: false
  });

  // Active View ('landing' | 'map' | 'missions' | 'routes' | 'achievements' | 'profile')
  readonly currentView = signal<'landing' | 'map' | 'missions' | 'routes' | 'achievements' | 'profile'>('landing');

  // Modals state
  readonly activeModal = signal<'info' | 'privacy' | 'tutorial' | 'location' | 'session-expired' | 'auth' | 'auth-sim' | null>(null);

  // Computed signals
  readonly isAuthenticated = computed(() => this.session().isAuthenticated);
  readonly isTutorialPending = computed(() => !this.session().tutorialCompleted);
  readonly isLocationGranted = computed(() => this.session().locationPermission === 'granted');
  readonly isLocationBlocked = computed(() => this.session().locationPermission === 'blocked' || this.session().locationPermission === 'denied');

  // Tutorial steps data
  readonly tutorialSteps: TutorialStep[] = [
    {
      id: 1,
      badge: 'Paso 1 de 3',
      title: 'Explora tu entorno',
      subtitle: 'El mundo real es tu mapa de juego',
      description: 'Sal a caminar y descubre puntos de interés ocultos, monumentos, parques y secretos de tu ciudad con el mapa interactivo.',
      icon: '🗺️'
    },
    {
      id: 2,
      badge: 'Paso 2 de 3',
      title: 'Cumple misiones y rutas',
      subtitle: 'Desafíos diseñados para moverte',
      description: 'Acepta misiones urbanas, visita paradas con confirmación GPS y completa recorridos temáticos para ganar XP.',
      icon: '🎯'
    },
    {
      id: 3,
      badge: 'Paso 3 de 3',
      title: 'Sube de rango y gana premios',
      subtitle: 'De Pingüino a Flamenco y más allá',
      description: 'Compite en la Liga Semanal, desbloquea insignias exclusivas, personaliza tu avatar y canjea cupones reales.',
      icon: '🏆'
    }
  ];

  // Current active step in tutorial
  readonly currentTutorialStep = signal<number>(0);

  /**
   * Flujo principal: "Presiona Jugar" (Diagrama de Flujo 1)
   */
  handlePlayClick(): void {
    if (!this.session().isAuthenticated) {
      // Usuario visitante -> Ir a autenticación (Módulo 02)
      this.openModal('auth');
      return;
    }

    // Usuario autenticado -> Comprobar tutorial
    this.checkTutorialOrLocation();
  }

  /**
   * Comprobar si el tutorial está pendiente o pasar a ubicación
   */
  checkTutorialOrLocation(): void {
    if (!this.session().tutorialCompleted) {
      this.currentTutorialStep.set(0);
      this.openModal('tutorial');
    } else {
      this.checkLocationPermission();
    }
  }

  /**
   * Onboarding: Completar tutorial
   */
  completeTutorial(): void {
    this.session.update(s => ({ ...s, tutorialCompleted: true }));
    this.closeModal();
    // Continuar a solicitar ubicación
    this.checkLocationPermission();
  }

  /**
   * Onboarding: Omitir tutorial
   */
  skipTutorial(): void {
    this.session.update(s => ({ ...s, tutorialCompleted: true }));
    this.closeModal();
    // Continuar a solicitar ubicación
    this.checkLocationPermission();
  }

  /**
   * Solicitar permiso de ubicación
   */
  checkLocationPermission(): void {
    if (this.session().locationPermission === 'granted') {
      // Cargar mapa interactivo y mostrar navegación adaptable
      this.currentView.set('map');
      this.closeModal();
    } else {
      // Solicitar ubicación
      this.openModal('location');
    }
  }

  /**
   * El usuario concede el permiso de ubicación
   */
  grantLocation(): void {
    this.session.update(s => ({ ...s, locationPermission: 'granted' }));
    this.closeModal();
    this.currentView.set('map');
  }

  /**
   * El usuario deniega o falla el permiso
   */
  denyLocation(): void {
    this.session.update(s => ({ ...s, locationPermission: 'denied' }));
    // El modal cambiará de vista para "Explicar necesidad del permiso" con "¿Reintentar?"
  }

  /**
   * Usuario decide mantener acceso al mapa bloqueado
   */
  keepMapBlocked(): void {
    this.session.update(s => ({ ...s, locationPermission: 'blocked' }));
    this.closeModal();
    // Queda en portada con aviso de acceso bloqueado
    this.currentView.set('landing');
  }

  /**
   * Usuario reintenta conceder ubicación
   */
  retryLocation(): void {
    this.session.update(s => ({ ...s, locationPermission: 'prompt' }));
    // Intenta de nuevo
    this.grantLocation();
  }

  /**
   * CASO EXCEPCIONAL: SESIÓN EXPIRADA (Diagrama 2)
   */
  simulateExpiredSession(): void {
    // 1. Detener acciones privadas
    // 2. Limpiar estado sensible de la interfaz
    // 3. Redirigir a portada /
    this.session.update(s => ({
      ...s,
      isAuthenticated: false,
      isSessionExpired: true
    }));
    this.currentView.set('landing');
    // 4. Mostrar aviso: sesión expirada
    this.openModal('session-expired');
  }

  /**
   * Re-ingresar tras sesión expirada
   */
  reAuthenticate(): void {
    this.session.update(s => ({
      ...s,
      isAuthenticated: true,
      isSessionExpired: false
    }));
    this.closeModal();
    this.checkTutorialOrLocation();
  }

  /**
   * Permanecer en portada tras sesión expirada
   */
  stayOnLanding(): void {
    this.session.update(s => ({
      ...s,
      isSessionExpired: false
    }));
    this.closeModal();
    this.currentView.set('landing');
  }

  /**
   * Iniciar sesión como explorador simulado
   */
  simulateLogin(): void {
    this.session.update(s => ({
      ...s,
      isAuthenticated: true,
      isSessionExpired: false
    }));
    this.closeModal();
    this.checkTutorialOrLocation();
  }

  /**
   * Volver a estado visitante
   */
  setAsVisitor(): void {
    this.session.update(s => ({
      ...s,
      isAuthenticated: false,
      tutorialCompleted: false,
      locationPermission: 'prompt',
      isSessionExpired: false
    }));
    this.currentView.set('landing');
    this.closeModal();
  }

  openModal(modal: 'info' | 'privacy' | 'tutorial' | 'location' | 'session-expired' | 'auth' | 'auth-sim'): void {
    this.activeModal.set(modal);
  }

  closeModal(): void {
    this.activeModal.set(null);
  }

  navigate(view: 'landing' | 'map' | 'missions' | 'routes' | 'achievements' | 'profile'): void {
    if (view !== 'landing' && !this.session().isAuthenticated) {
      this.handlePlayClick();
      return;
    }
    if (view === 'map' && this.session().locationPermission !== 'granted') {
      this.checkLocationPermission();
      return;
    }
    this.currentView.set(view);
  }
}
