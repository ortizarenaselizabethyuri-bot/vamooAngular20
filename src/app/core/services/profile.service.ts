import { Injectable, signal, computed, inject } from '@angular/core';
import { 
  AvatarCustomization, 
  AvatarOption, 
  PlayerStats, 
  PrivacySettings, 
  UsernameChangeInfo 
} from '../models/profile.model';
import { SessionService } from './session.service';
import { AchievementsService } from './achievements.service';
import { MissionsService } from './missions.service';
import { RoutesService } from './routes.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private sessionService = inject(SessionService);
  private achievementsService = inject(AchievementsService);
  private missionsService = inject(MissionsService);
  private routesService = inject(RoutesService);

  // Active Sub-Tab (Diseño de navegación Página 18): 'summary' | 'avatar' | 'stats' | 'settings'
  readonly activeSubTab = signal<'summary' | 'avatar' | 'stats' | 'settings'>('summary');

  // Avatar Customization State (Página 20)
  readonly avatarCustomization = signal<AvatarCustomization>({
    baseModel: 'Pingüino Explorador 3D',
    outfitColor: '#5c47ff', // Azul Vamoo original
    hatAccessory: 'Gorro Aviador Vintage',
    pinAccessory: 'Pluma de Explorador',
    aura: null
  });

  // Avatar Customization Catalog (Colores, Accesorios, Pines y Auras)
  readonly avatarOptions = signal<AvatarOption[]>([
    // Colores
    {
      id: 'col_vamoo_blue',
      type: 'color',
      name: 'Azul Vamoo Clásico',
      icon: '🟦',
      previewClass: '#5c47ff',
      requiredRank: 'Pingüino',
      isUnlocked: true,
      unlockConditionText: 'Desbloqueado por defecto'
    },
    {
      id: 'col_emerald_green',
      type: 'color',
      name: 'Verde Esmeralda Botánico',
      icon: '🟩',
      previewClass: '#10b981',
      requiredRank: 'Pingüino',
      isUnlocked: true,
      unlockConditionText: 'Desbloqueado por defecto'
    },
    {
      id: 'col_flamenco_coral',
      type: 'color',
      name: 'Coral Flamenco Andino',
      icon: '🦩',
      previewClass: '#f43f5e',
      requiredRank: 'Flamenco',
      isUnlocked: false,
      unlockConditionText: 'Requiere Rango Flamenco (201+ XP)'
    },
    {
      id: 'col_gold_condor',
      type: 'color',
      name: 'Oro Imperial Cóndor',
      icon: '👑',
      previewClass: '#eab308',
      requiredRank: 'Cóndor',
      isUnlocked: false,
      unlockConditionText: 'Requiere Rango Cóndor Legendario'
    },
    // Sombreros y Accesorios de Cabeza
    {
      id: 'hat_aviador',
      type: 'hat',
      name: 'Gorro Aviador Vintage',
      icon: '🧢',
      requiredRank: 'Pingüino',
      isUnlocked: true,
      unlockConditionText: 'Equipo inicial de explorador'
    },
    {
      id: 'hat_trekking',
      type: 'hat',
      name: 'Gorra Senderista Impermeable',
      icon: '👒',
      requiredRank: 'Flamenco',
      isUnlocked: false,
      unlockConditionText: 'Requiere Rango Flamenco o 3 Misiones'
    },
    {
      id: 'hat_crown',
      type: 'hat',
      name: 'Corona Dorada del Campeón',
      icon: '👑',
      requiredRank: 'Cóndor',
      isUnlocked: false,
      unlockConditionText: 'Ganador de Liga Semanal o Rango Cóndor'
    },
    // Pines e Insignias Equipables
    {
      id: 'pin_pluma',
      type: 'pin',
      name: 'Pluma de Explorador',
      icon: '🪶',
      requiredRank: 'Pingüino',
      isUnlocked: true,
      unlockConditionText: 'Equipo inicial'
    },
    {
      id: 'pin_compass',
      type: 'pin',
      name: 'Brújula de Bronce',
      icon: '🧭',
      requiredRank: 'Pingüino',
      requiredBadgeId: 'b_desc_01',
      isUnlocked: true,
      unlockConditionText: 'Desbloqueado con Insignia Primer Paso'
    },
    {
      id: 'pin_fire_wings',
      type: 'pin',
      name: 'Alas de Fuego',
      icon: '🔥',
      requiredRank: 'Flamenco',
      requiredBadgeId: 'b_flamenco',
      isUnlocked: false,
      unlockConditionText: 'Requiere Rango Flamenco'
    },
    // Auras
    {
      id: 'aura_none',
      type: 'aura',
      name: 'Sin Aura',
      icon: '⚪',
      requiredRank: 'Pingüino',
      isUnlocked: true,
      unlockConditionText: 'Normal'
    },
    {
      id: 'aura_green',
      type: 'aura',
      name: 'Aura Esmeralda Caminante',
      icon: '✨',
      requiredRank: 'Flamenco',
      isUnlocked: false,
      unlockConditionText: 'Requiere Rango Flamenco'
    },
    {
      id: 'aura_gold',
      type: 'aura',
      name: 'Aura Dorada Legendaria',
      icon: '🌟',
      requiredRank: 'Cóndor',
      isUnlocked: false,
      unlockConditionText: 'Rango Máximo Cóndor'
    }
  ]);

  // Privacy Settings (Página 22: Ajustes de privacidad y perfil público limitado)
  readonly privacySettings = signal<PrivacySettings>({
    isPublicProfile: true,
    showBadges: true,
    showStats: true,
    showWeeklyRank: true
  });

  // Username Change State (Página 21: Período de espera y cambio atómico)
  readonly usernameChangeInfo = signal<UsernameChangeInfo>({
    canChangeNow: true,
    daysRemainingForNextChange: 0,
    lastChangedDate: undefined
  });

  // Feedback Notification Toast
  readonly toastMessage = signal<{ text: string; type: 'info' | 'success' | 'warn' | 'error' } | null>(null);

  // Computed Player Stats (Página 18: Resumen del jugador)
  readonly playerStats = computed<PlayerStats>(() => {
    const session = this.sessionService.session();
    const missions = this.missionsService.missions();
    const routes = this.routesService.routes();
    const league = this.achievementsService.leagueState();

    const missionsCompleted = missions.filter(m => m.timesCompleted > 0).length;
    const routesCompleted = routes.filter(r => r.status === 'completed').length;
    const badgesUnlockedCount = this.achievementsService.unlockedBadgesCount();

    // Km caminados estimados (misiones + rutas completadas)
    const missionsKm = missionsCompleted * 0.45;
    const routesKm = routes.filter(r => r.status === 'completed').reduce((acc, r) => acc + r.totalDistanceKm, 0);
    const totalKm = Math.round((missionsKm + routesKm + 1.2) * 10) / 10;

    return {
      totalXp: session.xp,
      currentRank: session.rank,
      missionsCompleted,
      routesCompleted,
      totalKmWalked: totalKm,
      badgesUnlockedCount,
      weeklyLeagueRank: league.userRank,
      weeklyXp: league.userWeeklyXp
    };
  });

  /**
   * Cambiar de subpestaña en el Perfil
   */
  setSubTab(tab: 'summary' | 'avatar' | 'stats' | 'settings'): void {
    this.activeSubTab.set(tab);
  }

  /**
   * EQUIPAR ACCESORIO O COLOR DE AVATAR (Página 20: Validar si está desbloqueado)
   */
  equipOption(option: AvatarOption): boolean {
    const session = this.sessionService.session();
    const isFlamencoOrHigher = session.rank === 'Flamenco' || session.xp >= 201;

    // Verificar requisito de desbloqueo dinámico
    let allowed = option.isUnlocked;
    if (option.requiredRank === 'Flamenco' && isFlamencoOrHigher) {
      allowed = true;
    }

    if (!allowed) {
      this.showToast(`🔒 ${option.name}: ${option.unlockConditionText}`, 'warn');
      return false;
    }

    this.avatarCustomization.update(c => {
      if (option.type === 'color') return { ...c, outfitColor: option.previewClass || '#5c47ff' };
      if (option.type === 'hat') return { ...c, hatAccessory: option.name };
      if (option.type === 'pin') return { ...c, pinAccessory: option.name };
      if (option.type === 'aura') return { ...c, aura: option.id === 'aura_none' ? null : option.name };
      return c;
    });

    this.showToast(`✓ Equipado: ${option.name}`, 'success');
    return true;
  }

  /**
   * CAMBIO DE NOMBRE DE USUARIO (Página 21: Validación, período de espera y cambio atómico)
   */
  changeUsername(newName: string): { success: boolean; message: string } {
    const trimmed = newName.trim();

    // 1. Validar período de espera
    if (!this.usernameChangeInfo().canChangeNow) {
      const days = this.usernameChangeInfo().daysRemainingForNextChange;
      const msg = `Debes esperar ${days} días antes de solicitar otro cambio de nombre de usuario.`;
      this.showToast(msg, 'warn');
      return { success: false, message: msg };
    }

    // 2. Validar formato y contenido
    if (trimmed.length < 3 || trimmed.length > 18) {
      const msg = 'El nombre debe contener entre 3 y 18 caracteres.';
      this.showToast(msg, 'error');
      return { success: false, message: msg };
    }

    const validCharsRegex = /^[a-zA-Z0-9_]+$/;
    if (!validCharsRegex.test(trimmed)) {
      const msg = 'Solo se permiten letras, números y guiones bajos (sin espacios).';
      this.showToast(msg, 'error');
      return { success: false, message: msg };
    }

    // 3. Validar disponibilidad (evitar duplicados)
    const taken = ['admin', 'vamoo', 'moderador', 'soporte'];
    if (taken.includes(trimmed.toLowerCase())) {
      const msg = `El nombre de usuario "${trimmed}" no está disponible.`;
      this.showToast(msg, 'error');
      return { success: false, message: msg };
    }

    // 4. Guardar cambio de forma atómica en Sesión y Liga Semanal
    this.sessionService.session.update(s => ({
      ...s,
      username: trimmed
    }));

    this.achievementsService.leagueLeaderboard.update(board =>
      board.map(p => p.isCurrentUser ? { ...p, username: trimmed } : p)
    );

    // 5. Registrar fecha del cambio y activar cooldown de 30 días
    this.usernameChangeInfo.set({
      canChangeNow: false,
      daysRemainingForNextChange: 30,
      lastChangedDate: new Date().toISOString()
    });

    const successMsg = `¡Nombre de usuario actualizado con éxito a "${trimmed}"!`;
    this.showToast(successMsg, 'success');
    return { success: true, message: successMsg };
  }

  /**
   * AJUSTES DE PRIVACIDAD (Página 22)
   */
  updatePrivacySettings(settings: Partial<PrivacySettings>): void {
    this.privacySettings.update(curr => ({ ...curr, ...settings }));
    this.showToast('Configuración de privacidad guardada.', 'success');
  }

  /**
   * SIMULADOR: Resetear cooldown de cambio de nombre para pruebas
   */
  resetUsernameCooldownForTesting(): void {
    this.usernameChangeInfo.set({
      canChangeNow: true,
      daysRemainingForNextChange: 0
    });
    this.showToast('🛠️ Período de espera de cambio de nombre reiniciado para pruebas.', 'info');
  }

  private showToast(text: string, type: 'info' | 'success' | 'warn' | 'error'): void {
    this.toastMessage.set({ text, type });
    setTimeout(() => {
      if (this.toastMessage()?.text === text) {
        this.toastMessage.set(null);
      }
    }, 4500);
  }
}
