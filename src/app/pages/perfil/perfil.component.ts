import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UserProfile } from '../../services/auth.service.js';
import { ThemeService } from '../../services/theme.service.js';
import {
  PerfilService,
  AchievementItem,
  UserStats,
  UserStreakInfo,
  UserActivityItem,
  ProfileCustomization,
  ProfileComment,
  HealthBenefit,
} from '../../services/perfil.service.js';

/**
 * Componente de Visualización de Perfil de Aventurero (PerfilComponent).
 *
 * Propósito: Ofrecer una experiencia de perfil rica, inmersiva e interactiva
 * basada en la icónica estética y módulos de Steam Profile (Showcases, Nivel,
 * Insignias destacadas, Actividad reciente, Estadísticas y Muro de comentarios),
 * adaptada al universo andino y de gamificación ecológica de Vamoo.
 */
@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly perfilService = inject(PerfilService);
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router, { optional: true });

  /** Estado del usuario activo */
  readonly currentUser = this.authService.currentUser;
  readonly isAuthenticated = this.authService.isAuthenticated;

  /** Pestaña activa en la vista de perfil */
  readonly activeTab = signal<'resumen' | 'insignias' | 'salud' | 'actividad' | 'comentarios'>('resumen');

  /** Datos del perfil y vitrinas */
  readonly achievements = signal<AchievementItem[]>([]);
  readonly featuredBadges = signal<AchievementItem[]>([]);
  readonly stats = signal<UserStats>({ totalOutings: 0, totalDistanceKm: 0, totalXpEarned: 0 });
  readonly streak = signal<UserStreakInfo>({
    semanasConsecutivas: 1,
    salidasValidasSemana: 1,
    metaSemanal: 3,
    estaCongelada: false,
  });
  readonly activities = signal<UserActivityItem[]>([]);
  readonly healthBenefits = signal<HealthBenefit[]>([]);
  readonly customization = signal<ProfileCustomization>({
    bio: '',
    location: '',
    statusMessage: '',
    favoriteRouteName: '',
    favoriteRouteDistance: '',
    steamTheme: 'steam-classic',
  });
  readonly comments = signal<ProfileComment[]>([]);

  /** Filtro de categoría en el expositor de beneficios de salud */
  readonly selectedBenefitFilter = signal<string>('todos');

  /** Distancia en km para el simulador interactivo de caminata */
  readonly simulatedKm = signal<number>(4);

  /** Pasos totales calculados a partir de la distancia recorrida (1 km ≈ 1,350 pasos) */
  readonly totalSteps = computed(() => {
    return this.stats().estimatedSteps ?? Math.round((this.stats().totalDistanceKm || 0) * 1350);
  });

  /** Calorías totales quemadas estimadas (1 km ≈ 62 kcal en caminata promedio) */
  readonly totalCalories = computed(() => {
    return this.stats().estimatedCaloriesBurned ?? Math.round((this.stats().totalDistanceKm || 0) * 62);
  });

  /** Kilos de dióxido de carbono (CO2) evitados frente a transporte motorizado (~150g/km) */
  readonly totalCo2Saved = computed(() => {
    return this.stats().estimatedCo2SavedKg ?? Number(((this.stats().totalDistanceKm || 0) * 0.15).toFixed(1));
  });

  /** Métricas del simulador interactivo de salud */
  readonly simulatedSteps = computed(() => Math.round(this.simulatedKm() * 1350));
  readonly simulatedCalories = computed(() => Math.round(this.simulatedKm() * 62));
  readonly simulatedCo2 = computed(() => Number((this.simulatedKm() * 0.15).toFixed(2)));
  readonly simulatedMinutes = computed(() => Math.round(this.simulatedKm() * 12.5));

  /** Beneficios filtrados según la categoría seleccionada */
  readonly filteredBenefits = computed(() => {
    const filter = this.selectedBenefitFilter();
    if (filter === 'todos') {
      return this.healthBenefits();
    }
    return this.healthBenefits().filter((b) => b.category === filter);
  });

  /** Control del modal de edición de perfil */
  readonly isEditModalOpen = signal<boolean>(false);
  /** Control del modal de selección de insignias */
  readonly isBadgeModalOpen = signal<boolean>(false);
  /** Mensaje de alerta / notificación toast */
  readonly toastMessage = signal<string | null>(null);

  /** Formulario reactivo para edición de perfil */
  editForm = {
    name: '',
    picture: '',
    bio: '',
    location: '',
    statusMessage: '',
    favoriteRouteName: '',
    steamTheme: 'steam-classic' as 'steam-classic' | 'midnight-blue' | 'cyber-neon' | 'forest-rpg',
  };

  /** Nuevo comentario a ingresar */
  newCommentText = '';

  /** Selección temporal de hasta 3 IDs de insignias */
  selectedBadgeIds: string[] = [];

  /** Avatares predefinidos pixelados para elegir */
  readonly avatarPresets: { label: string; url: string }[] = [
    { label: 'Pichón Andino', url: '🐣' },
    { label: 'Pingüino Explorador', url: '🐧' },
    { label: 'Flamenco Silvestre', url: '🦩' },
    { label: 'Oso de Anteojos', url: '🐻' },
    { label: 'Tortuga Sabia', url: '🐢' },
    { label: 'Bagre Dorado', url: '🐟' },
    { label: 'Llama Mística', url: '🦙' },
    { label: 'Cóndor Real', url: '🦅' },
  ];

  /** Cálculo del nivel estilo Steam */
  readonly steamLevel = computed(() => {
    const xp = this.currentUser()?.totalXp ?? 0;
    return Math.max(1, Math.floor(xp / 100) + 1);
  });

  /** Progreso en porcentaje hacia el siguiente nivel de Steam */
  readonly levelProgressPercent = computed(() => {
    const xp = this.currentUser()?.totalXp ?? 0;
    return (xp % 100);
  });

  /** Insignia principal destacada en el header (Featured Badge) */
  readonly headerFeaturedBadge = computed(() => {
    const featured = this.featuredBadges();
    if (featured.length > 0) return featured[0];
    const all = this.achievements();
    return all.length > 0 ? all[0] : null;
  });

  ngOnInit(): void {
    this.loadProfileData();
  }

  /**
   * Carga todos los datos necesarios para montar el perfil estilo Steam.
   */
  loadProfileData(): void {
    const user = this.currentUser();
    const userId = user?._id || 'guest-user';

    // 1. Cargar personalización local
    const custom = this.perfilService.getProfileCustomization(userId);
    this.customization.set(custom);

    // 2. Cargar comentarios del muro
    this.comments.set(this.perfilService.getProfileComments(userId));

    // 3. Cargar catálogo de beneficios para la salud de salir
    this.healthBenefits.set(this.perfilService.getHealthBenefits());

    if (!user?._id) {
      // Perfil de invitado / demostración inicial
      this.achievements.set(this.perfilService['getDefaultStarterBadges']());
      this.featuredBadges.set(this.achievements().slice(0, 3));
      this.activities.set(this.perfilService['getDefaultStarterActivities']());
      this.stats.set({
        totalOutings: 8,
        totalDistanceKm: 24.5,
        totalXpEarned: 380,
        estimatedSteps: Math.round(24.5 * 1350),
        estimatedCaloriesBurned: Math.round(24.5 * 62),
        estimatedCo2SavedKg: Number((24.5 * 0.15).toFixed(1)),
      });
      return;
    }

    // 3. Consultar insignias del backend
    this.perfilService.getUserAchievements(user._id).subscribe((badges) => {
      this.achievements.set(badges);
      this.resolveFeaturedBadges(user, badges);
    });

    // 4. Consultar estadísticas de actividad física
    this.perfilService.getUserStats(user._id).subscribe((userStats) => {
      this.stats.set(userStats);
    });

    // 5. Consultar racha semanal
    this.perfilService.getUserStreak(user._id).subscribe((streakData) => {
      this.streak.set(streakData);
    });

    // 6. Consultar actividades recientes
    this.perfilService.getUserActivities(user._id).subscribe((activities) => {
      this.activities.set(activities);
    });
  }

  /**
   * Resuelve las insignias destacadas a partir de featuredBadges de MongoDB
   * o selecciona las primeras si aún no han sido configuradas.
   */
  private resolveFeaturedBadges(user: UserProfile, badges: AchievementItem[]): void {
    const userFeaturedIds = ((user as any).featuredBadges || []).map((id: any) => id.toString?.() || String(id));
    if (userFeaturedIds.length > 0) {
      const filtered = badges.filter((b) => userFeaturedIds.includes(b._id));
      if (filtered.length > 0) {
        this.featuredBadges.set(filtered.slice(0, 3));
        return;
      }
    }
    this.featuredBadges.set(badges.slice(0, 3));
  }

  /**
   * Selecciona una pestaña de navegación en el perfil.
   */
  setTab(tab: 'resumen' | 'insignias' | 'salud' | 'actividad' | 'comentarios'): void {
    this.activeTab.set(tab);
  }

  /**
   * Filtra las condecoraciones y consejos de salud por categoría.
   */
  setBenefitFilter(category: string): void {
    this.selectedBenefitFilter.set(category);
  }

  /**
   * Modifica la distancia en km para el simulador de salud.
   */
  setSimulatedKm(km: number): void {
    this.simulatedKm.set(Math.max(1, Math.min(50, km)));
  }

  /**
   * Estima los pasos dados para una distancia en km.
   */
  calcSteps(km: number): number {
    return Math.round((km || 0) * 1350);
  }

  /**
   * Estima las calorías quemadas para una distancia en km.
   */
  calcCalories(km: number): number {
    return Math.round((km || 0) * 62);
  }

  /**
   * Abre el modal de edición de perfil e inicializa el formulario con los valores actuales.
   */
  openEditModal(): void {
    const user = this.currentUser();
    const custom = this.customization();
    this.editForm = {
      name: user?.name || '',
      picture: user?.picture || '',
      bio: custom.bio,
      location: custom.location,
      statusMessage: custom.statusMessage,
      favoriteRouteName: custom.favoriteRouteName,
      steamTheme: custom.steamTheme,
    };
    this.isEditModalOpen.set(true);
  }

  /**
   * Alterna entre modo oscuro y modo claro.
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  /**
   * Cierra el modal de edición.
   */
  closeEditModal(): void {
    this.isEditModalOpen.set(false);
  }

  /**
   * Aplica un preset de avatar al formulario de edición.
   */
  selectAvatarPreset(presetUrl: string): void {
    this.editForm.picture = presetUrl;
  }

  /**
   * Guarda los cambios del perfil tanto en el backend como en la personalización local.
   */
  saveProfileChanges(): void {
    const user = this.currentUser();
    const userId = user?._id || 'guest-user';

    // 1. Guardar personalización local
    const updatedCustom: ProfileCustomization = {
      bio: this.editForm.bio.trim() || 'Aventurero de Vamoo.',
      location: this.editForm.location.trim() || 'Huancayo, Junín, Perú',
      statusMessage: this.editForm.statusMessage.trim() || 'En línea',
      favoriteRouteName: this.editForm.favoriteRouteName.trim() || 'Ruta Huanca',
      favoriteRouteDistance: this.customization().favoriteRouteDistance,
      steamTheme: this.editForm.steamTheme,
    };
    this.perfilService.saveProfileCustomization(userId, updatedCustom);
    this.customization.set(updatedCustom);

    // 2. Si hay usuario autenticado, actualizar nombre y picture en backend
    if (user?._id) {
      const patchData: Partial<UserProfile> = {
        name: this.editForm.name.trim() || user.name,
        picture: this.editForm.picture.trim() || user.picture,
      };

      this.perfilService.updateUserProfile(user._id, patchData).subscribe({
        next: () => {
          this.showToast('¡Perfil actualizado con éxito en Steam & Vamoo!');
          this.closeEditModal();
        },
        error: () => {
          // Si hubo error de red, actualizar de todos modos el estado reactivo local
          this.authService.updateUser(patchData);
          this.showToast('Perfil actualizado localmente.');
          this.closeEditModal();
        },
      });
    } else {
      this.showToast('¡Perfil personalizado con éxito!');
      this.closeEditModal();
    }
  }

  /**
   * Abre el modal para equipar hasta 3 insignias destacadas en la vitrina.
   */
  openBadgeSelectorModal(): void {
    this.selectedBadgeIds = this.featuredBadges().map((b) => b._id);
    this.isBadgeModalOpen.set(true);
  }

  /**
   * Cierra el modal de insignias.
   */
  closeBadgeModal(): void {
    this.isBadgeModalOpen.set(false);
  }

  /**
   * Alterna la selección de una insignia para el expositor.
   */
  toggleBadgeSelection(badgeId: string): void {
    const index = this.selectedBadgeIds.indexOf(badgeId);
    if (index > -1) {
      this.selectedBadgeIds.splice(index, 1);
    } else {
      if (this.selectedBadgeIds.length >= 3) {
        this.showToast('Solo puedes destacar un máximo de 3 insignias.');
        return;
      }
      this.selectedBadgeIds.push(badgeId);
    }
  }

  /**
   * Verifica si una insignia está actualmente seleccionada en el modal.
   */
  isBadgeSelected(badgeId: string): boolean {
    return this.selectedBadgeIds.includes(badgeId);
  }

  /**
   * Guarda las insignias destacadas seleccionadas.
   */
  saveFeaturedBadges(): void {
    const user = this.currentUser();
    const badges = this.achievements().filter((b) => this.selectedBadgeIds.includes(b._id));
    this.featuredBadges.set(badges);

    if (user?._id) {
      this.perfilService.updateFeaturedBadges(user._id, this.selectedBadgeIds).subscribe(() => {
        this.showToast('¡Vitrina de insignias actualizada!');
      });
    } else {
      this.showToast('¡Vitrina de insignias actualizada!');
    }
    this.closeBadgeModal();
  }

  /**
   * Publica un nuevo comentario en el muro de perfil.
   */
  postComment(): void {
    if (!this.newCommentText.trim()) return;

    const user = this.currentUser();
    const userId = user?._id || 'guest-user';

    const newComment: ProfileComment = {
      id: 'cmt-' + Date.now(),
      authorName: user?.name || 'Aventurero Visitante',
      authorAvatar: user?.picture || this.getRankEmoji(user?.currentRank),
      authorRank: user?.currentRank || 'Pichón',
      content: this.newCommentText.trim(),
      date: 'Justo ahora',
    };

    const updated = this.perfilService.addProfileComment(userId, newComment);
    this.comments.set(updated);
    this.newCommentText = '';
    this.showToast('Comentario publicado en el muro.');
  }

  /**
   * Elimina un comentario del muro.
   */
  deleteComment(commentId: string): void {
    const user = this.currentUser();
    const userId = user?._id || 'guest-user';
    const updated = this.perfilService.deleteProfileComment(userId, commentId);
    this.comments.set(updated);
    this.showToast('Comentario eliminado.');
  }

  /**
   * Copia el enlace del perfil al portapapeles.
   */
  copyProfileLink(): void {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      this.showToast('¡Enlace de perfil copiado al portapapeles!');
    }
  }

  /**
   * Redirige al mapa de juego.
   */
  goToGame(): void {
    if (this.router) {
      this.router.navigate(['/jugar']);
    }
  }

  /**
   * Redirige al login si es visitante.
   */
  goToLogin(): void {
    if (this.router) {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Muestra un mensaje flotante tipo toast temporal.
   */
  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3500);
  }

  /**
   * Retorna el color/clase del círculo de nivel estilo Steam según el rango de nivel.
   */
  getLevelTierClass(level: number): string {
    if (level >= 50) return 'lvl-tier-gold';
    if (level >= 40) return 'lvl-tier-purple';
    if (level >= 30) return 'lvl-tier-cyan';
    if (level >= 20) return 'lvl-tier-green';
    if (level >= 10) return 'lvl-tier-red';
    return 'lvl-tier-blue';
  }

  /**
   * Obtiene el emoji o símbolo asociado a la fauna del usuario.
   */
  getRankEmoji(rank?: string): string {
    const r = (rank || '').toLowerCase();
    if (r.includes('bagre')) return '🐟';
    if (r.includes('tortuga')) return '🐢';
    if (r.includes('oso')) return '🐻';
    if (r.includes('flamenco')) return '🦩';
    if (r.includes('pingüino') || r.includes('pinguino')) return '🐧';
    return '🐣';
  }
}

