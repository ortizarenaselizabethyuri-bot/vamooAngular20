import { Injectable, signal, computed, inject } from '@angular/core';
import { 
  AchievementTab, 
  BadgeCategory, 
  RankTier, 
  BadgeItem, 
  CouponReward, 
  LeagueParticipant, 
  LeagueState 
} from '../models/achievements.model';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class AchievementsService {
  private sessionService = inject(SessionService);

  // Active Tab: Rangos | Insignias | Premios | Ligas (Página 6)
  readonly activeTab = signal<AchievementTab>('ranks');

  // Badge Category Filter: 'all' | 'descubrimiento' | 'mision' | 'recorrido'
  readonly activeBadgeFilter = signal<'all' | BadgeCategory>('all');

  // Ranks Configuration Ladder
  readonly rankTiers = signal<RankTier[]>([
    {
      id: 'pinguino',
      name: 'Pingüino',
      icon: '🐧',
      minXp: 0,
      maxXp: 200,
      badgeReward: 'Pluma de Explorador',
      perks: [
        'Acceso al mapa urbano interactivo',
        'Participación en misiones peatonales básicas',
        'Canje de cupones de nivel inicial'
      ],
      isCurrent: true,
      isUnlocked: true
    },
    {
      id: 'flamenco',
      name: 'Flamenco',
      icon: '🦩',
      minXp: 201,
      maxXp: 600,
      badgeReward: 'Alas de Fuego',
      perks: [
        'Multiplicador 1.1x de XP en Ligas Semanales',
        'Desbloqueo de misiones de Descubrimiento Cultural',
        'Descuentos exclusivos en tiendas de trekking y deportes'
      ],
      isCurrent: false,
      isUnlocked: false
    },
    {
      id: 'liebre',
      name: 'Liebre',
      icon: '🐇',
      minXp: 601,
      maxXp: 1200,
      badgeReward: 'Pisada Ligera',
      perks: [
        'Acceso prioritario a eventos urbanos de fin de semana',
        'Multiplicador 1.25x de XP semanal',
        'Cupones VIP de cafeterías aliadas'
      ],
      isCurrent: false,
      isUnlocked: false
    },
    {
      id: 'guanaco',
      name: 'Guanaco',
      icon: '🦙',
      minXp: 1201,
      maxXp: 2000,
      badgeReward: 'Guardián del Altiplano',
      perks: [
        'Creación de recorridos personalizados comunitarios',
        'Insignia brillante en el ranking de la liga',
        'Pase libre en museos patrimoniales asociados'
      ],
      isCurrent: false,
      isUnlocked: false
    },
    {
      id: 'condor',
      name: 'Cóndor',
      icon: '🦅',
      minXp: 2001,
      maxXp: 5000,
      badgeReward: 'Vuelo Supremo',
      perks: [
        'Rango máximo legendario de la ciudad',
        'Avatar con aura dorada en mapa en vivo',
        'Invitación a las Finales Anuales de Vamoo'
      ],
      isCurrent: false,
      isUnlocked: false
    }
  ]);

  // Badges Catalog across 3 Categories (Página 7)
  readonly badges = signal<BadgeItem[]>([
    {
      id: 'b_desc_01',
      title: 'Primer Paso Urbano',
      description: 'Descubre y visita tu primer punto de interés patrimonial en el mapa.',
      category: 'descubrimiento',
      icon: '🧭',
      isUnlocked: true,
      unlockedAt: '2026-10-20',
      currentProgress: 1,
      targetProgress: 1,
      associatedReward: 'Cupón Café Aliado'
    },
    {
      id: 'b_desc_02',
      title: 'Espíritu Botánico',
      description: 'Encuentra y valida 3 parques o reservas naturales urbanas.',
      category: 'descubrimiento',
      icon: '🌲',
      isUnlocked: false,
      currentProgress: 2,
      targetProgress: 3,
      associatedReward: 'Insignia Jardín Secreto'
    },
    {
      id: 'b_desc_03',
      title: 'Cazador de Monumentos',
      description: 'Visita 5 monumentos históricos reconocidos en el mapa.',
      category: 'descubrimiento',
      icon: '🏛️',
      isUnlocked: false,
      currentProgress: 3,
      targetProgress: 5,
      associatedReward: 'Accesorio Bufanda de Explorador'
    },
    {
      id: 'b_mis_01',
      title: 'Misión Cumplida',
      description: 'Supera con éxito tu primera misión peatonal con confirmación GPS.',
      category: 'mision',
      icon: '🎯',
      isUnlocked: true,
      unlockedAt: '2026-10-22',
      currentProgress: 1,
      targetProgress: 1,
      associatedReward: '+50 XP Extra'
    },
    {
      id: 'b_mis_02',
      title: 'Caminante Constante',
      description: 'Completa 5 misiones peatonales de exploración.',
      category: 'mision',
      icon: '🚶',
      isUnlocked: false,
      currentProgress: 3,
      targetProgress: 5,
      associatedReward: 'Cupón 25% Heladería'
    },
    {
      id: 'b_mis_03',
      title: 'Precisión Impecable',
      description: 'Valida tu llegada con GPS a menos de 15 metros del objetivo.',
      category: 'mision',
      icon: '📍',
      isUnlocked: true,
      unlockedAt: '2026-10-23',
      currentProgress: 1,
      targetProgress: 1,
      associatedReward: 'Brújula Holográfica'
    },
    {
      id: 'b_rec_01',
      title: 'Sendero Histórico',
      description: 'Completa un recorrido temático con al menos 3 paradas secuenciales.',
      category: 'recorrido',
      icon: '🗺️',
      isUnlocked: false,
      currentProgress: 1,
      targetProgress: 3,
      associatedReward: 'Medalla Ruta Colonial'
    },
    {
      id: 'b_rec_02',
      title: 'Maestro de Rutas',
      description: 'Finaliza 3 recorridos temáticos urbanos completos sin abandonar.',
      category: 'recorrido',
      icon: '🏆',
      isUnlocked: false,
      currentProgress: 0,
      targetProgress: 3,
      associatedReward: 'Título Honorífico: Cartógrafo'
    }
  ]);

  // Partner Coupon Rewards Catalog (UML: "Reclamar cupón" + "Validar campaña")
  readonly couponRewards = signal<CouponReward[]>([
    {
      id: 'c_01',
      partnerName: 'Café del Parque Histórico',
      category: 'Café & Comida',
      partnerLogo: '☕',
      discount: '2x1 en Bebidas de Especialidad',
      description: 'Válido de lunes a viernes en todas las bebidas artesanales calientes o frías.',
      requiredRank: 'Pingüino',
      campaignActive: true,
      code: 'VAMOO-CAFE-7749',
      isClaimed: false,
      expiresInDays: 14
    },
    {
      id: 'c_02',
      partnerName: 'Helados Artesanales Vamoo',
      category: 'Café & Comida',
      partnerLogo: '🍦',
      discount: '25% de Descuento en Copas Dobles',
      description: 'Presenta este cupón digital al momento de ordenar en cualquier sucursal.',
      requiredRank: 'Pingüino',
      campaignActive: true,
      code: 'VAMOO-ICE-2026',
      isClaimed: true,
      claimedAt: '2026-10-22',
      expiresInDays: 7
    },
    {
      id: 'c_03',
      partnerName: 'Outdoor City Gear',
      category: 'Deportes',
      partnerLogo: '👟',
      discount: '20% OFF en Calzado para Caminata',
      description: 'Exclusivo para exploradores con rango Flamenco o superior. Ideal para tus rutas.',
      requiredRank: 'Flamenco',
      campaignActive: true,
      code: 'VAMOO-TREK-8812',
      isClaimed: false,
      expiresInDays: 20
    },
    {
      id: 'c_04',
      partnerName: 'Museo y Galerías Centrales',
      category: 'Cultura',
      partnerLogo: '🏛️',
      discount: 'Pase 2x1 en Exposición Temporal',
      description: 'Entrada compartida para cualquier exhibición cultural de la semana.',
      requiredRank: 'Flamenco',
      campaignActive: true,
      code: 'VAMOO-MUSEO-4491',
      isClaimed: false,
      expiresInDays: 30
    }
  ]);

  // Weekly League State (Página 8)
  readonly leagueState = signal<LeagueState>({
    isEnrolled: true,
    seasonTitle: 'Temporada Primavera 2026',
    divisionName: 'División Plata (Exploradores Activos)',
    daysRemaining: 3,
    hoursRemaining: 14,
    totalParticipants: 32,
    userRank: 4,
    userWeeklyXp: 210
  });

  // Weekly Leaderboard Participants List (Página 8)
  readonly leagueLeaderboard = signal<LeagueParticipant[]>([
    {
      rankPosition: 1,
      userId: 'usr_01',
      username: 'camila_urban',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=camila',
      weeklyXp: 460,
      isCurrentUser: false,
      tierBadge: '🦙 Guanaco',
      trend: 'same'
    },
    {
      rankPosition: 2,
      userId: 'usr_02',
      username: 'alex_runner',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex',
      weeklyXp: 390,
      isCurrentUser: false,
      tierBadge: '🐇 Liebre',
      trend: 'up'
    },
    {
      rankPosition: 3,
      userId: 'usr_03',
      username: 'lucas_walk',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=lucas',
      weeklyXp: 315,
      isCurrentUser: false,
      tierBadge: '🦩 Flamenco',
      trend: 'up'
    },
    {
      rankPosition: 4,
      userId: 'usr_curr',
      username: 'ExploradorVamoo',
      avatar: 'assets/mascot.jpg',
      weeklyXp: 210,
      isCurrentUser: true,
      tierBadge: '🐧 Pingüino',
      trend: 'up'
    },
    {
      rankPosition: 5,
      userId: 'usr_05',
      username: 'dani_city',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=dani',
      weeklyXp: 185,
      isCurrentUser: false,
      tierBadge: '🐧 Pingüino',
      trend: 'down'
    },
    {
      rankPosition: 6,
      userId: 'usr_06',
      username: 'sofia_travel',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=sofia',
      weeklyXp: 150,
      isCurrentUser: false,
      tierBadge: '🐧 Pingüino',
      trend: 'same'
    },
    {
      rankPosition: 7,
      userId: 'usr_07',
      username: 'mateo_gps',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=mateo',
      weeklyXp: 120,
      isCurrentUser: false,
      tierBadge: '🐧 Pingüino',
      trend: 'down'
    },
    {
      rankPosition: 8,
      userId: 'usr_08',
      username: 'valen_explora',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=valen',
      weeklyXp: 95,
      isCurrentUser: false,
      tierBadge: '🐧 Pingüino',
      trend: 'same'
    }
  ]);

  // Modal for Claimed Coupon Details
  readonly activeClaimedCoupon = signal<CouponReward | null>(null);

  // Feedback Notification Toast
  readonly toastMessage = signal<{ text: string; type: 'info' | 'success' | 'warn' } | null>(null);

  // Computed Values
  readonly currentRankInfo = computed(() => {
    const session = this.sessionService.session();
    const currentXp = session.xp;
    
    // Find matching tier
    const tiers = this.rankTiers();
    let currentTier = tiers[0];
    let nextTier = tiers[1];

    for (let i = 0; i < tiers.length; i++) {
      if (currentXp >= tiers[i].minXp && (currentXp <= tiers[i].maxXp || i === tiers.length - 1)) {
        currentTier = tiers[i];
        nextTier = tiers[i + 1] || tiers[i];
        break;
      }
    }

    const tierRange = nextTier.minXp - currentTier.minXp;
    const progressInTier = Math.max(0, currentXp - currentTier.minXp);
    const progressPercent = Math.min(100, Math.round((progressInTier / (tierRange || 1)) * 100));

    return {
      currentTier,
      nextTier,
      currentXp,
      progressInTier,
      tierRange,
      progressPercent
    };
  });

  readonly filteredBadges = computed(() => {
    const filter = this.activeBadgeFilter();
    if (filter === 'all') return this.badges();
    return this.badges().filter(b => b.category === filter);
  });

  readonly unlockedBadgesCount = computed(() => {
    return this.badges().filter(b => b.isUnlocked).length;
  });

  /**
   * Cambiar de pestaña en Logros: Rangos | Insignias | Premios | Ligas
   */
  setActiveTab(tab: AchievementTab): void {
    this.activeTab.set(tab);
  }

  /**
   * Filtrar categoría de insignias
   */
  setBadgeFilter(filter: 'all' | BadgeCategory): void {
    this.activeBadgeFilter.set(filter);
  }

  /**
   * CANJEAR CUPÓN («include» Validar Campaña - UML)
   */
  claimCoupon(coupon: CouponReward): boolean {
    if (!coupon.campaignActive) {
      this.showToast('Esta campaña de recompensa ha finalizado.', 'warn');
      return false;
    }

    const currentXp = this.sessionService.session().xp;
    if (coupon.requiredRank === 'Flamenco' && currentXp < 201) {
      this.showToast('Debes alcanzar el rango Flamenco (201+ XP) para desbloquear este cupón.', 'warn');
      return false;
    }

    // Registrar cupón como canjeado
    this.couponRewards.update(list => 
      list.map(c => c.id === coupon.id ? { ...c, isClaimed: true, claimedAt: new Date().toISOString() } : c)
    );

    this.activeClaimedCoupon.set(coupon);
    this.showToast(`¡Cupón '${coupon.discount}' canjeado con éxito!`, 'success');
    return true;
  }

  closeClaimedModal(): void {
    this.activeClaimedCoupon.set(null);
  }

  /**
   * INSCRIBIRSE EN LIGA SEMANAL (Página 8)
   */
  enrollInWeeklyLeague(): void {
    this.leagueState.update(s => ({
      ...s,
      isEnrolled: true,
      userRank: 4,
      userWeeklyXp: this.sessionService.session().xp
    }));
    this.showToast('¡Inscripción confirmada! Ya estás compitiendo en la Liga Semanal.', 'success');
  }

  /**
   * RECALCULAR CLASIFICACIÓN CON NUEVO XP SEMANAL (Página 8: "Recalcular clasificación")
   */
  simulateAddWeeklyXp(extraXp: number = 50): void {
    const session = this.sessionService.session();
    const newTotalXp = session.xp + extraXp;
    
    // Promoción de rango automática si cruza el umbral
    let newRank = session.rank;
    if (newTotalXp >= 201 && session.rank === 'Pingüino') {
      newRank = 'Flamenco';
      this.showToast('🎉 ¡FELICITACIONES! Has ascendido de rango a 🦩 Flamenco.', 'success');
    }

    this.sessionService.session.update(s => ({
      ...s,
      xp: newTotalXp,
      rank: newRank
    }));

    // Actualizar XP en la tabla de la liga
    const currentWeekly = this.leagueState().userWeeklyXp + extraXp;
    this.leagueState.update(s => ({
      ...s,
      userWeeklyXp: currentWeekly
    }));

    // Recalcular posiciones del leaderboard
    let board = this.leagueLeaderboard().map(p => {
      if (p.isCurrentUser) {
        return { ...p, weeklyXp: currentWeekly, tierBadge: `${newRank === 'Flamenco' ? '🦩' : '🐧'} ${newRank}`, trend: 'up' as const };
      }
      return p;
    });

    // Ordenar de mayor a menor XP
    board.sort((a, b) => b.weeklyXp - a.weeklyXp);

    // Reasignar posiciones 1, 2, 3...
    board = board.map((p, idx) => ({ ...p, rankPosition: idx + 1 }));
    this.leagueLeaderboard.set(board);

    // Actualizar posición del usuario en el state
    const myNewPos = board.find(p => p.isCurrentUser)?.rankPosition || 1;
    this.leagueState.update(s => ({ ...s, userRank: myNewPos }));

    this.showToast(`+${extraXp} XP semanal registrado. ¡Ahora estás en el puesto #${myNewPos}!`, 'success');
  }

  /**
   * DESBLOQUEAR INSIGNIA (Página 7: "Registrar desbloqueo")
   */
  unlockBadge(badgeId: string): void {
    const badge = this.badges().find(b => b.id === badgeId);
    if (!badge || badge.isUnlocked) return;

    this.badges.update(list =>
      list.map(b => b.id === badgeId ? { ...b, isUnlocked: true, currentProgress: b.targetProgress, unlockedAt: new Date().toISOString() } : b)
    );

    this.showToast(`🏆 ¡Insignia Desbloqueada: ${badge.title}!`, 'success');
  }

  private showToast(text: string, type: 'info' | 'success' | 'warn'): void {
    this.toastMessage.set({ text, type });
    setTimeout(() => {
      if (this.toastMessage()?.text === text) {
        this.toastMessage.set(null);
      }
    }, 4500);
  }
}
