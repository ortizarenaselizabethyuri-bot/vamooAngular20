import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AchievementsService } from '../../core/services/achievements.service';
import { SessionService } from '../../core/services/session.service';
import { AchievementTab, BadgeCategory, CouponReward } from '../../core/models/achievements.model';

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="achievements-page">
      <!-- Container -->
      <div class="achievements-container">
        
        <!-- Header: Resumen de Rango y XP del Jugador (Estructura de la pantalla - Página 6) -->
        <section class="player-progress-card">
          <div class="progress-main-row">
            <div class="rank-avatar-col">
              <div class="rank-shield-icon">
                <span class="shield-emoji">{{ achievementsService.currentRankInfo().currentTier.icon }}</span>
              </div>
              <div class="rank-text-meta">
                <span class="player-label">Ejemplo de jugador • Vamoo Pass</span>
                <h1 class="rank-title">{{ sessionService.session().rank }}</h1>
                <span class="xp-accumulated">{{ sessionService.session().xp }} XP acumulados</span>
              </div>
            </div>

            <div class="rank-progress-col">
              <div class="progress-labels">
                <span class="next-rank-label">
                  Progreso hacia <strong>{{ achievementsService.currentRankInfo().nextTier.name }}</strong>
                </span>
                <span class="xp-ratio">
                  <strong>{{ achievementsService.currentRankInfo().progressInTier }}</strong> / {{ achievementsService.currentRankInfo().tierRange }} XP
                </span>
              </div>

              <div class="progress-bar-track">
                <div 
                  class="progress-bar-fill" 
                  [style.width.%]="achievementsService.currentRankInfo().progressPercent"
                ></div>
              </div>

              <p class="rule-hint">
                💡 <em>La XP total determina el rango. No se gasta al reclamar recompensas.</em>
              </p>
            </div>
          </div>
        </section>

        <!-- Segmented Tab Navigation: [ Rangos | Insignias | Premios | Ligas ] (Página 6) -->
        <nav class="achievements-tabs-nav" role="tablist">
          <button 
            type="button" 
            class="nav-tab-btn" 
            [class.active]="achievementsService.activeTab() === 'ranks'"
            (click)="achievementsService.setActiveTab('ranks')"
          >
            <span class="tab-emoji">🎖️</span>
            <span>Rangos</span>
          </button>

          <button 
            type="button" 
            class="nav-tab-btn" 
            [class.active]="achievementsService.activeTab() === 'badges'"
            (click)="achievementsService.setActiveTab('badges')"
          >
            <span class="tab-emoji">🏅</span>
            <span>Insignias</span>
            <span class="badge-count">{{ achievementsService.unlockedBadgesCount() }}/8</span>
          </button>

          <button 
            type="button" 
            class="nav-tab-btn" 
            [class.active]="achievementsService.activeTab() === 'rewards'"
            (click)="achievementsService.setActiveTab('rewards')"
          >
            <span class="tab-emoji">🎁</span>
            <span>Premios y Cupones</span>
          </button>

          <button 
            type="button" 
            class="nav-tab-btn" 
            [class.active]="achievementsService.activeTab() === 'leagues'"
            (click)="achievementsService.setActiveTab('leagues')"
          >
            <span class="tab-emoji">🏆</span>
            <span>Ligas Semanales</span>
            <span class="live-dot"></span>
          </button>
        </nav>

        <!-- Feedback Notification Toast -->
        @if (achievementsService.toastMessage(); as toast) {
          <div class="feedback-toast" [class]="toast.type">
            <span>{{ toast.text }}</span>
          </div>
        }

        <!-- ========================================== -->
        <!-- PESTAÑA 1: RANGOS (ESCALAFÓN DE EXPLORADOR)-->
        <!-- ========================================== -->
        @if (achievementsService.activeTab() === 'ranks') {
          <div class="tab-panel fade-in">
            <div class="panel-header">
              <div>
                <h2>Escalafón de Rangos Urbanos</h2>
                <p>Asciende de nivel explorando monumentos, parques y superando misiones en tu ciudad.</p>
              </div>
            </div>

            <div class="tiers-ladder-grid">
              @for (tier of achievementsService.rankTiers(); track tier.id) {
                <div 
                  class="tier-card" 
                  [class.current]="tier.name === sessionService.session().rank"
                  [class.unlocked]="sessionService.session().xp >= tier.minXp"
                >
                  <div class="tier-card-header">
                    <div class="tier-icon-wrap">
                      <span>{{ tier.icon }}</span>
                    </div>
                    <div>
                      <div class="tier-title-row">
                        <h3>{{ tier.name }}</h3>
                        @if (tier.name === sessionService.session().rank) {
                          <span class="badge-status-current">Rango Actual</span>
                        } @else if (sessionService.session().xp >= tier.minXp) {
                          <span class="badge-status-done">✓ Desbloqueado</span>
                        } @else {
                          <span class="badge-status-locked">🔒 Bloqueado</span>
                        }
                      </div>
                      <span class="tier-xp-range">{{ tier.minXp }} — {{ tier.maxXp }} XP acumulados</span>
                    </div>
                  </div>

                  <div class="tier-perks-box">
                    <span class="perks-title">Beneficios del Rango:</span>
                    <ul>
                      @for (perk of tier.perks; track perk) {
                        <li>✓ {{ perk }}</li>
                      }
                    </ul>
                  </div>

                  <div class="tier-reward-footer">
                    <span class="reward-title">Recompensa simbólica:</span>
                    <strong class="reward-val">🎖️ {{ tier.badgeReward }}</strong>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- PESTAÑA 2: INSIGNIAS (3 CATEGORÍAS)        -->
        <!-- ========================================== -->
        @if (achievementsService.activeTab() === 'badges') {
          <div class="tab-panel fade-in">
            <div class="panel-header">
              <div>
                <h2>Colección de Insignias y Logros</h2>
                <p>Supera desafíos en las 3 vertientes oficiales: Descubrimiento, Misiones y Recorridos.</p>
              </div>

              <!-- Filtro de Categoría (Página 7) -->
              <div class="category-filters">
                <button 
                  type="button" 
                  class="filter-btn" 
                  [class.active]="achievementsService.activeBadgeFilter() === 'all'"
                  (click)="achievementsService.setBadgeFilter('all')"
                >
                  Todas
                </button>
                <button 
                  type="button" 
                  class="filter-btn" 
                  [class.active]="achievementsService.activeBadgeFilter() === 'descubrimiento'"
                  (click)="achievementsService.setBadgeFilter('descubrimiento')"
                >
                  🧭 Descubrimiento
                </button>
                <button 
                  type="button" 
                  class="filter-btn" 
                  [class.active]="achievementsService.activeBadgeFilter() === 'mision'"
                  (click)="achievementsService.setBadgeFilter('mision')"
                >
                  🎯 Misiones
                </button>
                <button 
                  type="button" 
                  class="filter-btn" 
                  [class.active]="achievementsService.activeBadgeFilter() === 'recorrido'"
                  (click)="achievementsService.setBadgeFilter('recorrido')"
                >
                  🚶 Recorridos
                </button>
              </div>
            </div>

            <div class="badges-grid">
              @for (badge of achievementsService.filteredBadges(); track badge.id) {
                <div class="badge-card" [class.unlocked]="badge.isUnlocked">
                  <div class="badge-icon-box">
                    <span class="badge-main-icon">{{ badge.icon }}</span>
                    @if (badge.isUnlocked) {
                      <span class="unlocked-check">✓</span>
                    }
                  </div>

                  <div class="badge-content">
                    <div class="badge-top-row">
                      <span class="badge-category-tag">{{ badge.category | uppercase }}</span>
                      @if (badge.isUnlocked) {
                        <span class="unlocked-date">Obtenida</span>
                      }
                    </div>

                    <h3 class="badge-title">{{ badge.title }}</h3>
                    <p class="badge-desc">{{ badge.description }}</p>

                    <div class="badge-progress-wrap">
                      <div class="badge-progress-labels">
                        <span>Progreso</span>
                        <span>{{ badge.currentProgress }} / {{ badge.targetProgress }}</span>
                      </div>
                      <div class="badge-progress-bar">
                        <div 
                          class="badge-progress-fill" 
                          [style.width.%]="(badge.currentProgress / badge.targetProgress) * 100"
                        ></div>
                      </div>
                    </div>

                    @if (badge.associatedReward) {
                      <div class="badge-reward-pill">
                        <span>🎁 {{ badge.associatedReward }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- PESTAÑA 3: PREMIOS Y CUPONES (COMERCIOS)   -->
        <!-- ========================================== -->
        @if (achievementsService.activeTab() === 'rewards') {
          <div class="tab-panel fade-in">
            <div class="panel-header">
              <div>
                <h2>Premios y Cupones de Comercios Aliados</h2>
                <p>Canjea beneficios reales en tiendas, cafeterías y centros culturales gracias a tu actividad física.</p>
              </div>
            </div>

            <div class="coupons-grid">
              @for (coupon of achievementsService.couponRewards(); track coupon.id) {
                <div class="coupon-card" [class.claimed]="coupon.isClaimed">
                  <div class="coupon-header">
                    <div class="partner-meta">
                      <span class="partner-logo">{{ coupon.partnerLogo }}</span>
                      <div>
                        <strong class="partner-name">{{ coupon.partnerName }}</strong>
                        <span class="partner-category">{{ coupon.category }}</span>
                      </div>
                    </div>
                    <span class="campaign-tag">✓ Campaña Activa</span>
                  </div>

                  <div class="coupon-body">
                    <h3 class="coupon-discount">{{ coupon.discount }}</h3>
                    <p class="coupon-desc">{{ coupon.description }}</p>
                    
                    <div class="coupon-conditions">
                      <span class="cond-pill">
                        🎖️ Requiere Rango <strong>{{ coupon.requiredRank }}</strong>
                      </span>
                      <span class="cond-pill expires">
                        ⏳ Expira en {{ coupon.expiresInDays }} días
                      </span>
                    </div>
                  </div>

                  <div class="coupon-footer">
                    @if (coupon.isClaimed) {
                      <button class="btn-coupon-claimed" (click)="achievementsService.claimCoupon(coupon)">
                        ✓ Canjeado • Ver Código Promocional
                      </button>
                    } @else if (sessionService.session().rank === 'Pingüino' && coupon.requiredRank === 'Flamenco') {
                      <button class="btn-coupon-locked" disabled>
                        🔒 Desbloquea con Rango Flamenco
                      </button>
                    } @else {
                      <button class="btn-coupon-claim" (click)="achievementsService.claimCoupon(coupon)">
                        🎁 Reclamar Cupón
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- ========================================== -->
        <!-- PESTAÑA 4: LIGAS SEMANALES                 -->
        <!-- ========================================== -->
        @if (achievementsService.activeTab() === 'leagues') {
          <div class="tab-panel fade-in">
            <!-- Caso: No Inscrito (Diagrama Página 8) -->
            @if (!achievementsService.leagueState().isEnrolled) {
              <div class="league-enrollment-card">
                <div class="trophy-big">🏆</div>
                <h2>Liga Semanal de Exploradores</h2>
                <p class="enroll-desc">
                  Compite sanamente caminando por tu ciudad. Acumula XP completando misiones y recorridos, sube puestos en el ranking regional y gana premios exclusivos todos los domingos.
                </p>

                <div class="rules-box">
                  <div class="rule-item">
                    <span class="rule-icon">🛡️</span>
                    <div>
                      <strong>Juego Limpio y Seguro:</strong>
                      <small>Solo se validan pasos y puntos con confirmación GPS real a velocidad peatonal.</small>
                    </div>
                  </div>
                  <div class="rule-item">
                    <span class="rule-icon">🔒</span>
                    <div>
                      <strong>Privacidad Total:</strong>
                      <small>Solo se muestra tu nickname y avatar en la tabla de clasificación pública.</small>
                    </div>
                  </div>
                </div>

                <button class="btn-enroll-league" (click)="achievementsService.enrollInWeeklyLeague()">
                  🚀 Inscribirme en la Liga Semanal
                </button>
              </div>
            } @else {
              <!-- Caso: Inscrito (Tabla de Clasificación y XP Semanal - Página 8) -->
              <div class="league-active-dashboard">
                <!-- Season Countdown Bar -->
                <div class="league-season-bar">
                  <div class="season-info">
                    <span class="season-badge">Temporada Activa</span>
                    <h3>{{ achievementsService.leagueState().seasonTitle }}</h3>
                    <small>{{ achievementsService.leagueState().divisionName }}</small>
                  </div>

                  <div class="season-countdown">
                    <span class="countdown-label">Tiempo Restante:</span>
                    <div class="countdown-boxes">
                      <div class="time-box">
                        <span class="time-val">{{ achievementsService.leagueState().daysRemaining }}</span>
                        <span class="time-unit">Días</span>
                      </div>
                      <div class="time-box">
                        <span class="time-val">{{ achievementsService.leagueState().hoursRemaining }}</span>
                        <span class="time-unit">Horas</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Simulation Action Bar for Testers -->
                <div class="league-dev-bar">
                  <span>🧪 Simulación de Actividades en Servidor:</span>
                  <button class="btn-dev-xp" (click)="achievementsService.simulateAddWeeklyXp(50)">
                    ⚡ Simular Misión (+50 XP Semanal) y Recalcular Puesto
                  </button>
                </div>

                <!-- Top 3 Podium Cards -->
                <div class="podium-row">
                  <!-- 2nd Place -->
                  <div class="podium-card second">
                    <div class="medal-icon">🥈</div>
                    <img [src]="achievementsService.leagueLeaderboard()[1].avatar" alt="Avatar" class="podium-avatar" />
                    <strong>{{ achievementsService.leagueLeaderboard()[1].username }}</strong>
                    <span class="podium-xp">{{ achievementsService.leagueLeaderboard()[1].weeklyXp }} XP</span>
                    <span class="podium-tier">{{ achievementsService.leagueLeaderboard()[1].tierBadge }}</span>
                  </div>

                  <!-- 1st Place (Gold) -->
                  <div class="podium-card first">
                    <div class="crown-icon">👑</div>
                    <div class="medal-icon">🥇</div>
                    <img [src]="achievementsService.leagueLeaderboard()[0].avatar" alt="Avatar" class="podium-avatar" />
                    <strong>{{ achievementsService.leagueLeaderboard()[0].username }}</strong>
                    <span class="podium-xp">{{ achievementsService.leagueLeaderboard()[0].weeklyXp }} XP</span>
                    <span class="podium-tier">{{ achievementsService.leagueLeaderboard()[0].tierBadge }}</span>
                  </div>

                  <!-- 3rd Place -->
                  <div class="podium-card third">
                    <div class="medal-icon">🥉</div>
                    <img [src]="achievementsService.leagueLeaderboard()[2].avatar" alt="Avatar" class="podium-avatar" />
                    <strong>{{ achievementsService.leagueLeaderboard()[2].username }}</strong>
                    <span class="podium-xp">{{ achievementsService.leagueLeaderboard()[2].weeklyXp }} XP</span>
                    <span class="podium-tier">{{ achievementsService.leagueLeaderboard()[2].tierBadge }}</span>
                  </div>
                </div>

                <!-- Full Leaderboard Table -->
                <div class="leaderboard-table-card">
                  <div class="table-header-row">
                    <span class="col-pos">Puesto</span>
                    <span class="col-user">Explorador</span>
                    <span class="col-tier">Rango</span>
                    <span class="col-trend">Tendencia</span>
                    <span class="col-xp">XP Semanal</span>
                  </div>

                  <div class="table-body">
                    @for (player of achievementsService.leagueLeaderboard(); track player.userId) {
                      <div 
                        class="table-row" 
                        [class.current-user-row]="player.isCurrentUser"
                      >
                        <span class="col-pos">
                          <strong class="pos-badge" [class.top]="player.rankPosition <= 3">
                            #{{ player.rankPosition }}
                          </strong>
                        </span>

                        <div class="col-user user-cell">
                          <img [src]="player.avatar" alt="Avatar" class="table-avatar" />
                          <div>
                            <strong>{{ player.username }}</strong>
                            @if (player.isCurrentUser) {
                              <span class="you-tag">¡Tú!</span>
                            }
                          </div>
                        </div>

                        <span class="col-tier tier-cell">{{ player.tierBadge }}</span>

                        <span class="col-trend trend-cell">
                          @if (player.trend === 'up') {
                            <span class="trend up">▲ Sube</span>
                          } @else if (player.trend === 'down') {
                            <span class="trend down">▼ Baja</span>
                          } @else {
                            <span class="trend same">— Igual</span>
                          }
                        </span>

                        <span class="col-xp xp-cell">
                          <strong>{{ player.weeklyXp }}</strong> XP
                        </span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Modal de Cupón Canjeado (Digital Voucher) -->
      @if (achievementsService.activeClaimedCoupon(); as coupon) {
        <div class="voucher-backdrop" (click)="achievementsService.closeClaimedModal()">
          <div class="voucher-card" (click)="$event.stopPropagation()">
            <button class="btn-close-voucher" (click)="achievementsService.closeClaimedModal()">✕</button>
            <div class="voucher-badge">Cupón Digital Vamoo</div>
            
            <span class="voucher-logo">{{ coupon.partnerLogo }}</span>
            <h3>{{ coupon.partnerName }}</h3>
            <div class="voucher-discount">{{ coupon.discount }}</div>
            <p class="voucher-desc">{{ coupon.description }}</p>

            <div class="qr-box">
              <div class="qr-mock">
                <span>[ Código QR Oficial ]</span>
                <small>Escanear en caja</small>
              </div>
              <div class="promo-code-box">
                <span class="code-label">CÓDIGO DE CANJE:</span>
                <strong class="code-val">{{ coupon.code }}</strong>
              </div>
            </div>

            <p class="voucher-instruction">
              Muestra este código al mesero o encargado de tienda para aplicar tu beneficio.
            </p>

            <button class="btn-done-voucher" (click)="achievementsService.closeClaimedModal()">
              Entendido, Guardar en Mis Cupones
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .achievements-page {
      background: #f8fafc;
      min-height: calc(100vh - 100px);
      padding: 24px 16px 60px 16px;
    }

    .achievements-container {
      max-width: 1080px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Player Summary Card (Page 6 Wireframe) */
    .player-progress-card {
      background: #ffffff;
      border-radius: var(--radius-xl);
      padding: 24px 28px;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
      border: 1px solid #e2e8f0;
    }

    .progress-main-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 32px;
      flex-wrap: wrap;
    }

    .rank-avatar-col {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .rank-shield-icon {
      width: 72px;
      height: 72px;
      border-radius: 20px;
      background: linear-gradient(135deg, var(--color-primary), #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.4rem;
      box-shadow: 0 8px 25px rgba(92, 71, 255, 0.35);
    }

    .rank-text-meta {
      display: flex;
      flex-direction: column;
    }
    .player-label {
      font-size: 0.76rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .rank-title {
      font-size: 1.8rem;
      font-weight: 900;
      margin: 2px 0;
      color: #0f172a;
      line-height: 1.1;
    }
    .xp-accumulated {
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--color-primary);
    }

    .rank-progress-col {
      flex: 1;
      min-width: 280px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.88rem;
      color: #334155;
    }

    .progress-bar-track {
      height: 12px;
      background: #e2e8f0;
      border-radius: var(--radius-pill);
      overflow: hidden;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary), #00d1b2);
      border-radius: var(--radius-pill);
      transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .rule-hint {
      font-size: 0.78rem;
      color: #64748b;
      margin: 0;
    }

    /* Segmented Tab Navigation */
    .achievements-tabs-nav {
      display: flex;
      gap: 8px;
      background: #e2e8f0;
      padding: 6px;
      border-radius: var(--radius-lg);
      overflow-x: auto;
    }

    .nav-tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: var(--radius-md);
      border: none;
      background: transparent;
      color: #475569;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    .nav-tab-btn:hover {
      color: #0f172a;
    }
    .nav-tab-btn.active {
      background: #ffffff;
      color: var(--color-primary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .badge-count {
      font-size: 0.7rem;
      background: #f1f5f9;
      color: var(--color-primary);
      padding: 2px 6px;
      border-radius: var(--radius-pill);
      font-weight: 800;
    }
    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
    }

    /* Feedback Toast */
    .feedback-toast {
      padding: 10px 18px;
      border-radius: var(--radius-md);
      font-size: 0.86rem;
      font-weight: 700;
      color: #ffffff;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
      animation: fadeIn 0.25s ease-out;
    }
    .feedback-toast.info { background: #3b82f6; }
    .feedback-toast.success { background: #10b981; }
    .feedback-toast.warn { background: #f59e0b; }

    /* Panels */
    .tab-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .panel-header h2 {
      font-size: 1.35rem;
      margin: 0 0 4px 0;
      color: #0f172a;
    }
    .panel-header p {
      font-size: 0.86rem;
      color: #64748b;
      margin: 0;
    }

    /* Tiers Ladder Grid */
    .tiers-ladder-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .tier-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: var(--radius-xl);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
      transition: all 0.2s;
    }
    .tier-card.current {
      border: 2px solid var(--color-primary);
      background: linear-gradient(180deg, #ffffff 0%, #faf8ff 100%);
      box-shadow: 0 8px 25px rgba(92, 71, 255, 0.15);
    }
    .tier-card.unlocked:not(.current) {
      border-color: #cbd5e1;
    }

    .tier-card-header {
      display: flex;
      gap: 14px;
      align-items: center;
    }
    .tier-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
    }
    .tier-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tier-title-row h3 {
      font-size: 1.15rem;
      margin: 0;
      color: #0f172a;
    }
    .badge-status-current {
      font-size: 0.68rem;
      font-weight: 800;
      background: #e0e7ff;
      color: #4338ca;
      padding: 2px 8px;
      border-radius: var(--radius-pill);
    }
    .badge-status-done {
      font-size: 0.68rem;
      font-weight: 700;
      background: #ecfdf5;
      color: #065f46;
      padding: 2px 8px;
      border-radius: var(--radius-pill);
    }
    .badge-status-locked {
      font-size: 0.68rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #94a3b8;
      padding: 2px 8px;
      border-radius: var(--radius-pill);
    }
    .tier-xp-range {
      font-size: 0.78rem;
      color: #64748b;
      font-weight: 600;
    }

    .tier-perks-box {
      background: #f8fafc;
      padding: 12px;
      border-radius: var(--radius-md);
      font-size: 0.78rem;
    }
    .perks-title {
      font-weight: 800;
      color: #475569;
      display: block;
      margin-bottom: 6px;
    }
    .tier-perks-box ul {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
      color: #334155;
    }

    .tier-reward-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.78rem;
      padding-top: 10px;
      border-top: 1px solid #f1f5f9;
    }
    .reward-title {
      color: #64748b;
    }
    .reward-val {
      color: var(--color-primary);
    }

    /* Badges Grid */
    .category-filters {
      display: flex;
      gap: 6px;
    }
    .filter-btn {
      padding: 6px 14px;
      border-radius: var(--radius-pill);
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }
    .filter-btn.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: #ffffff;
    }

    .badges-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .badge-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: var(--radius-xl);
      padding: 18px;
      display: flex;
      gap: 16px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
      position: relative;
    }
    .badge-card.unlocked {
      border-color: #a7f3d0;
      background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
    }

    .badge-icon-box {
      width: 58px;
      height: 58px;
      border-radius: 16px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      position: relative;
      flex-shrink: 0;
    }
    .badge-card.unlocked .badge-icon-box {
      background: #d1fae5;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.25);
    }
    .unlocked-check {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #10b981;
      color: #ffffff;
      font-size: 0.72rem;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #ffffff;
    }

    .badge-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .badge-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge-category-tag {
      font-size: 0.68rem;
      font-weight: 800;
      color: #64748b;
    }
    .unlocked-date {
      font-size: 0.7rem;
      font-weight: 700;
      color: #065f46;
      background: #d1fae5;
      padding: 1px 6px;
      border-radius: var(--radius-pill);
    }

    .badge-title {
      font-size: 1rem;
      margin: 0;
      color: #0f172a;
    }
    .badge-desc {
      font-size: 0.8rem;
      color: #475569;
      line-height: 1.4;
      margin: 0;
    }

    .badge-progress-wrap {
      display: flex;
      flex-direction: column;
      gap: 3px;
      margin-top: 4px;
    }
    .badge-progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      color: #64748b;
      font-weight: 700;
    }
    .badge-progress-bar {
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
    }
    .badge-progress-fill {
      height: 100%;
      background: #10b981;
      border-radius: 3px;
    }

    .badge-reward-pill {
      font-size: 0.72rem;
      font-weight: 700;
      color: #4338ca;
      background: #e0e7ff;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      width: fit-content;
      margin-top: 4px;
    }

    /* Coupons Grid */
    .coupons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
    }

    .coupon-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: var(--radius-xl);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
      position: relative;
    }
    .coupon-card.claimed {
      border-color: #a7f3d0;
      background: #f0fdf4;
    }

    .coupon-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .partner-meta {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .partner-logo {
      font-size: 1.8rem;
    }
    .partner-name {
      display: block;
      font-size: 0.9rem;
      color: #0f172a;
    }
    .partner-category {
      font-size: 0.72rem;
      color: #64748b;
    }
    .campaign-tag {
      font-size: 0.68rem;
      font-weight: 800;
      background: #d1fae5;
      color: #065f46;
      padding: 2px 8px;
      border-radius: var(--radius-pill);
    }

    .coupon-discount {
      font-size: 1.25rem;
      font-weight: 900;
      color: var(--color-primary);
      margin: 0 0 6px 0;
    }
    .coupon-desc {
      font-size: 0.82rem;
      color: #475569;
      margin: 0 0 10px 0;
      line-height: 1.4;
    }

    .coupon-conditions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .cond-pill {
      font-size: 0.72rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #334155;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
    }
    .cond-pill.expires {
      color: #b45309;
      background: #fef3c7;
    }

    .btn-coupon-claim {
      width: 100%;
      padding: 10px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--color-primary), #7c3aed);
      color: #ffffff;
      font-weight: 800;
      font-size: 0.86rem;
      border: none;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-coupon-claim:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(92, 71, 255, 0.35);
    }
    .btn-coupon-claimed {
      width: 100%;
      padding: 10px;
      border-radius: var(--radius-md);
      background: #10b981;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.86rem;
      border: none;
      cursor: pointer;
    }
    .btn-coupon-locked {
      width: 100%;
      padding: 10px;
      border-radius: var(--radius-md);
      background: #e2e8f0;
      color: #64748b;
      font-weight: 700;
      font-size: 0.84rem;
      border: none;
      cursor: not-allowed;
    }

    /* Weekly Leagues */
    .league-enrollment-card {
      background: #ffffff;
      border-radius: var(--radius-xl);
      padding: 40px 24px;
      text-align: center;
      max-width: 580px;
      margin: 0 auto;
      border: 1.5px solid #e2e8f0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .trophy-big {
      font-size: 3.5rem;
      margin-bottom: 12px;
    }
    .enroll-desc {
      font-size: 0.92rem;
      color: #475569;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .rules-box {
      display: flex;
      flex-direction: column;
      gap: 12px;
      text-align: left;
      background: #f8fafc;
      padding: 16px;
      border-radius: var(--radius-md);
      margin-bottom: 24px;
    }
    .rule-item {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .rule-icon {
      font-size: 1.3rem;
    }
    .rule-item strong {
      display: block;
      font-size: 0.85rem;
      color: #0f172a;
    }
    .rule-item small {
      font-size: 0.78rem;
      color: #64748b;
    }
    .btn-enroll-league {
      padding: 14px 28px;
      border-radius: var(--radius-pill);
      background: linear-gradient(135deg, var(--color-primary), #7c3aed);
      color: #ffffff;
      font-weight: 800;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(92, 71, 255, 0.35);
    }

    /* Active League Dashboard */
    .league-active-dashboard {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .league-season-bar {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      color: #ffffff;
      border-radius: var(--radius-xl);
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      box-shadow: 0 8px 30px rgba(30, 27, 75, 0.25);
    }
    .season-badge {
      font-size: 0.7rem;
      font-weight: 800;
      background: #10b981;
      color: #022c22;
      padding: 2px 8px;
      border-radius: var(--radius-pill);
      text-transform: uppercase;
    }
    .season-info h3 {
      font-size: 1.4rem;
      margin: 4px 0 2px 0;
    }
    .season-info small {
      color: #c7d2fe;
      font-size: 0.84rem;
    }

    .season-countdown {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }
    .countdown-label {
      font-size: 0.74rem;
      color: #c7d2fe;
      font-weight: 700;
    }
    .countdown-boxes {
      display: flex;
      gap: 8px;
    }
    .time-box {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      text-align: center;
      min-width: 50px;
    }
    .time-val {
      font-size: 1.2rem;
      font-weight: 900;
      display: block;
      line-height: 1;
    }
    .time-unit {
      font-size: 0.65rem;
      text-transform: uppercase;
      color: #c7d2fe;
    }

    .league-dev-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ede9fe;
      border: 1px dashed #8b5cf6;
      border-radius: var(--radius-md);
      padding: 8px 16px;
      font-size: 0.8rem;
      color: #5b21b6;
    }
    .btn-dev-xp {
      padding: 6px 14px;
      border-radius: var(--radius-sm);
      background: #6d28d9;
      color: #ffffff;
      border: none;
      font-weight: 700;
      font-size: 0.78rem;
      cursor: pointer;
    }

    /* Podium Row */
    .podium-row {
      display: grid;
      grid-template-columns: 1fr 1.15fr 1fr;
      gap: 16px;
      align-items: flex-end;
      margin-top: 10px;
    }
    .podium-card {
      background: #ffffff;
      border-radius: var(--radius-xl);
      padding: 20px 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      border: 1.5px solid #e2e8f0;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
      position: relative;
    }
    .podium-card.first {
      border: 2px solid #f59e0b;
      background: linear-gradient(180deg, #ffffff 0%, #fffbeb 100%);
      box-shadow: 0 8px 30px rgba(245, 158, 11, 0.2);
      transform: translateY(-8px);
    }
    .podium-card.second {
      border-color: #94a3b8;
    }
    .podium-card.third {
      border-color: #d97706;
    }
    .crown-icon {
      font-size: 1.6rem;
      position: absolute;
      top: -16px;
    }
    .medal-icon {
      font-size: 1.5rem;
    }
    .podium-avatar {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      border: 2px solid #e2e8f0;
    }
    .podium-xp {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--color-primary);
    }
    .podium-tier {
      font-size: 0.72rem;
      color: #64748b;
      font-weight: 600;
    }

    /* Leaderboard Table */
    .leaderboard-table-card {
      background: #ffffff;
      border-radius: var(--radius-xl);
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    }
    .table-header-row {
      display: grid;
      grid-template-columns: 80px 1fr 140px 100px 120px;
      padding: 12px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.76rem;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .table-body {
      display: flex;
      flex-direction: column;
    }
    .table-row {
      display: grid;
      grid-template-columns: 80px 1fr 140px 100px 120px;
      padding: 12px 20px;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.85rem;
      transition: background 0.15s;
    }
    .table-row:hover {
      background: #f8fafc;
    }
    .table-row.current-user-row {
      background: #eef2ff;
      border-left: 4px solid var(--color-primary);
    }
    .pos-badge {
      font-size: 0.9rem;
      color: #475569;
    }
    .pos-badge.top {
      color: #d97706;
      font-weight: 900;
    }
    .user-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .table-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }
    .you-tag {
      font-size: 0.68rem;
      background: var(--color-primary);
      color: #ffffff;
      padding: 1px 6px;
      border-radius: var(--radius-pill);
      margin-left: 6px;
      font-weight: 700;
    }
    .tier-cell {
      color: #475569;
      font-weight: 600;
      font-size: 0.8rem;
    }
    .trend {
      font-size: 0.75rem;
      font-weight: 700;
    }
    .trend.up { color: #10b981; }
    .trend.down { color: #ef4444; }
    .trend.same { color: #94a3b8; }
    .xp-cell {
      text-align: right;
      color: var(--color-primary);
    }

    /* Voucher Modal */
    .voucher-backdrop {
      position: fixed;
      inset: 0;
      z-index: 300;
      background: rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .voucher-card {
      background: #ffffff;
      border-radius: var(--radius-2xl);
      max-width: 440px;
      width: 100%;
      padding: 28px 24px;
      text-align: center;
      position: relative;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
      animation: modalContentPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .btn-close-voucher {
      position: absolute;
      top: 14px;
      right: 14px;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: none;
      background: #f1f5f9;
      color: #64748b;
      cursor: pointer;
    }
    .voucher-badge {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 800;
      color: var(--color-primary);
      background: var(--color-primary-light);
      padding: 2px 10px;
      border-radius: var(--radius-pill);
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .voucher-logo {
      font-size: 2.8rem;
      display: block;
      margin-bottom: 6px;
    }
    .voucher-discount {
      font-size: 1.4rem;
      font-weight: 900;
      color: var(--color-primary);
      margin: 4px 0;
    }
    .voucher-desc {
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 16px;
    }
    .qr-box {
      background: #f8fafc;
      border: 1.5px dashed #cbd5e1;
      border-radius: var(--radius-md);
      padding: 16px;
      margin-bottom: 16px;
    }
    .qr-mock {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-weight: 800;
      color: #334155;
      font-size: 0.95rem;
      margin-bottom: 10px;
    }
    .promo-code-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 8px;
      border-radius: var(--radius-sm);
    }
    .code-label {
      font-size: 0.68rem;
      font-weight: 800;
      color: #64748b;
      display: block;
    }
    .code-val {
      font-family: monospace;
      font-size: 1.2rem;
      letter-spacing: 0.15em;
      color: #0f172a;
    }
    .voucher-instruction {
      font-size: 0.76rem;
      color: #94a3b8;
      margin-bottom: 18px;
    }
    .btn-done-voucher {
      width: 100%;
      padding: 12px;
      border-radius: var(--radius-md);
      background: var(--color-primary);
      color: #ffffff;
      font-weight: 800;
      border: none;
      cursor: pointer;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @media (max-width: 768px) {
      .table-header-row, .table-row {
        grid-template-columns: 50px 1fr 100px;
      }
      .col-tier, .col-trend {
        display: none;
      }
      .podium-row {
        grid-template-columns: 1fr;
      }
      .podium-card.first {
        order: -1;
        transform: none;
      }
    }
  `]
})
export class AchievementsComponent {
  achievementsService = inject(AchievementsService);
  sessionService = inject(SessionService);
}
