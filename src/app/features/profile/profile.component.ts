import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';
import { SessionService } from '../../core/services/session.service';
import { AuthService } from '../../core/services/auth.service';
import { AvatarOption } from '../../core/models/profile.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-page">
      <div class="profile-container">

        <!-- Top Profile Banner & Identity Header (Página 18: Resumen del jugador) -->
        <section class="profile-hero-card">
          <div class="hero-main-row">
            <!-- Avatar Preview with Equipped Accessories -->
            <div class="avatar-stage">
              <div 
                class="avatar-glow-ring"
                [style.background]="profileService.avatarCustomization().aura ? 'radial-gradient(circle, rgba(234, 179, 8, 0.4) 0%, transparent 70%)' : 'none'"
              >
                <div 
                  class="avatar-circle-frame"
                  [style.border-color]="profileService.avatarCustomization().outfitColor"
                >
                  <img [src]="sessionService.session().avatar" alt="Avatar" class="avatar-base-img" />
                </div>
              </div>

              <!-- Equipped Hat floating badge -->
              @if (profileService.avatarCustomization().hatAccessory; as hat) {
                <span class="equipped-hat-pill" title="Accesorio de Cabeza">
                  🧢 {{ hat }}
                </span>
              }

              <!-- Equipped Pin floating badge -->
              @if (profileService.avatarCustomization().pinAccessory; as pin) {
                <span class="equipped-pin-pill" title="Insignia / Pin">
                  🪶 {{ pin }}
                </span>
              }
            </div>

            <!-- Profile Identity Information -->
            <div class="identity-info">
              <div class="badge-row">
                <span class="user-handle">&#64;{{ sessionService.session().username }}</span>
                <span class="rank-tag-hero">🎖️ Rango {{ sessionService.session().rank }}</span>
                <span class="pass-tag">Vamoo Pass Beta</span>
              </div>

              <h1 class="user-display-name">{{ sessionService.session().username }}</h1>
              <p class="user-email-meta">✉️ {{ sessionService.session().email }} • Miembro activo de la comunidad</p>

              <!-- Quick Progress Strip -->
              <div class="xp-strip">
                <span class="xp-count"><strong>{{ profileService.playerStats().totalXp }}</strong> XP acumulados</span>
                <span class="league-pos">🏆 Puesto <strong>#{{ profileService.playerStats().weeklyLeagueRank }}</strong> en Liga Semanal</span>
              </div>
            </div>

            <!-- Header Quick Actions -->
            <div class="hero-actions">
              <button class="btn-subnav-quick" (click)="profileService.setSubTab('avatar')">
                🎨 Personalizar Avatar
              </button>
              <button class="btn-subnav-quick settings" (click)="profileService.setSubTab('settings')">
                ⚙️ Ajustes
              </button>
            </div>
          </div>
        </section>

        <!-- Segmented Navigation Bar (Diseño de navegación Página 18: /yo, /yo/avatar, /yo/estadisticas, /yo/ajustes) -->
        <nav class="profile-tabs-nav" role="tablist">
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="profileService.activeSubTab() === 'summary'"
            (click)="profileService.setSubTab('summary')"
          >
            <span>👤</span>
            <span>Resumen del Jugador</span>
          </button>

          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="profileService.activeSubTab() === 'avatar'"
            (click)="profileService.setSubTab('avatar')"
          >
            <span>🎨</span>
            <span>Personalizar Avatar</span>
          </button>

          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="profileService.activeSubTab() === 'stats'"
            (click)="profileService.setSubTab('stats')"
          >
            <span>📊</span>
            <span>Estadísticas e Historial</span>
          </button>

          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="profileService.activeSubTab() === 'settings'"
            (click)="profileService.setSubTab('settings')"
          >
            <span>⚙️</span>
            <span>Ajustes y Cuenta</span>
          </button>
        </nav>

        <!-- Feedback Notification Toast -->
        @if (profileService.toastMessage(); as toast) {
          <div class="feedback-toast" [class]="toast.type">
            <span>{{ toast.text }}</span>
          </div>
        }

        <!-- ============================================== -->
        <!-- PESTAÑA 1: RESUMEN DEL JUGADOR                 -->
        <!-- ============================================== -->
        @if (profileService.activeSubTab() === 'summary') {
          <div class="tab-panel fade-in">
            <!-- 4 Metrics Dashboard Grid -->
            <div class="metrics-grid">
              <div class="metric-card">
                <span class="metric-icon">🎯</span>
                <span class="metric-val">{{ profileService.playerStats().missionsCompleted }}</span>
                <span class="metric-lbl">Misiones Superadas</span>
              </div>
              <div class="metric-card">
                <span class="metric-icon">🚶</span>
                <span class="metric-val">{{ profileService.playerStats().routesCompleted }}</span>
                <span class="metric-lbl">Circuitos Temáticos</span>
              </div>
              <div class="metric-card">
                <span class="metric-icon">📏</span>
                <span class="metric-val">{{ profileService.playerStats().totalKmWalked }} km</span>
                <span class="metric-lbl">Distancia Caminada</span>
              </div>
              <div class="metric-card">
                <span class="metric-icon">🏅</span>
                <span class="metric-val">{{ profileService.playerStats().badgesUnlockedCount }}</span>
                <span class="metric-lbl">Insignias Ganadas</span>
              </div>
            </div>

            <!-- Vamoo Pass Card -->
            <div class="pass-card">
              <div class="pass-header">
                <div>
                  <span class="pass-badge">TEMPORADA 2026</span>
                  <h2>Pase de Explorador Vamoo</h2>
                </div>
                <span class="pass-icon">🎫</span>
              </div>
              <p>Tu actividad peatonal se sincroniza automáticamente con el ranking metropolitano y las misiones comunitarias.</p>
              <div class="pass-perks-row">
                <span>✓ Acceso a todos los circuitos 2D</span>
                <span>✓ Cupones comerciales aliados</span>
                <span>✓ Validación GPS a velocidad peatonal</span>
              </div>
            </div>
          </div>
        }

        <!-- ============================================== -->
        <!-- PESTAÑA 2: PERSONALIZAR AVATAR (Página 20)     -->
        <!-- ============================================== -->
        @if (profileService.activeSubTab() === 'avatar') {
          <div class="tab-panel fade-in">
            <div class="wardrobe-layout">
              <!-- Left: Avatar Preview Showcase -->
              <div class="wardrobe-preview-col">
                <div class="wardrobe-stage">
                  <div 
                    class="avatar-big-glow"
                    [style.background]="profileService.avatarCustomization().aura ? 'radial-gradient(circle, rgba(234, 179, 8, 0.45) 0%, transparent 70%)' : 'none'"
                  >
                    <div 
                      class="avatar-big-frame"
                      [style.border-color]="profileService.avatarCustomization().outfitColor"
                    >
                      <img [src]="sessionService.session().avatar" alt="Vamoo Avatar" class="avatar-big-img" />
                    </div>
                  </div>

                  <div class="equipped-readout">
                    <div class="readout-item">
                      <span class="lbl">Color:</span>
                      <strong [style.color]="profileService.avatarCustomization().outfitColor">● Seleccionado</strong>
                    </div>
                    <div class="readout-item">
                      <span class="lbl">Accesorio:</span>
                      <strong>{{ profileService.avatarCustomization().hatAccessory || 'Ninguno' }}</strong>
                    </div>
                    <div class="readout-item">
                      <span class="lbl">Insignia / Pin:</span>
                      <strong>{{ profileService.avatarCustomization().pinAccessory || 'Ninguno' }}</strong>
                    </div>
                    <div class="readout-item">
                      <span class="lbl">Aura:</span>
                      <strong>{{ profileService.avatarCustomization().aura || 'Sin Aura' }}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right: Wardrobe Catalog & Customizer -->
              <div class="wardrobe-catalog-col">
                <div class="catalog-header">
                  <h2>Armario de Explorador</h2>
                  <p>Desbloquea colores y accesorios subiendo de rango y superando retos urbanos.</p>
                </div>

                <div class="wardrobe-categories">
                  <span class="cat-label">Selecciona elemento a equipar (Página 20):</span>
                  
                  <div class="options-grid">
                    @for (item of profileService.avatarOptions(); track item.id) {
                      <div 
                        class="wardrobe-item-card"
                        [class.unlocked]="item.isUnlocked || (item.requiredRank === 'Flamenco' && sessionService.session().xp >= 201)"
                        [class.locked]="!item.isUnlocked && (item.requiredRank !== 'Flamenco' || sessionService.session().xp < 201)"
                        (click)="profileService.equipOption(item)"
                      >
                        <div class="item-icon-box">
                          @if (item.type === 'color') {
                            <div class="color-swatch" [style.background]="item.previewClass"></div>
                          } @else {
                            <span>{{ item.icon }}</span>
                          }
                        </div>

                        <div class="item-text-box">
                          <strong class="item-name">{{ item.name }}</strong>
                          <span class="item-condition">
                            @if (item.isUnlocked || (item.requiredRank === 'Flamenco' && sessionService.session().xp >= 201)) {
                              <span class="text-unlocked">✓ Disponible</span>
                            } @else {
                              <span class="text-locked">🔒 {{ item.unlockConditionText }}</span>
                            }
                          </span>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ============================================== -->
        <!-- PESTAÑA 3: ESTADÍSTICAS E HISTORIAL (Página 18)-->
        <!-- ============================================== -->
        @if (profileService.activeSubTab() === 'stats') {
          <div class="tab-panel fade-in">
            <div class="stats-panel-card">
              <h2>Estadísticas de Actividad y Salud</h2>
              <p>Métricas registradas a velocidad peatonal a través del mapa interactivo.</p>

              <div class="stats-breakdown-grid">
                <div class="breakdown-box">
                  <span class="box-icon">🔥</span>
                  <span class="box-val">~{{ profileService.playerStats().totalKmWalked * 55 | number:'1.0-0' }} kcal</span>
                  <span class="box-lbl">Calorías Estimadas</span>
                </div>
                <div class="breakdown-box">
                  <span class="box-icon">👣</span>
                  <span class="box-val">~{{ profileService.playerStats().totalKmWalked * 1400 | number:'1.0-0' }}</span>
                  <span class="box-lbl">Pasos Registrados</span>
                </div>
                <div class="breakdown-box">
                  <span class="box-icon">⚡</span>
                  <span class="box-val">{{ profileService.playerStats().weeklyXp }} XP</span>
                  <span class="box-lbl">XP Esta Semana</span>
                </div>
                <div class="breakdown-box">
                  <span class="box-icon">🏆</span>
                  <span class="box-val">Top 15%</span>
                  <span class="box-lbl">Rendimiento en Liga</span>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ============================================== -->
        <!-- PESTAÑA 4: AJUSTES Y CUENTA (Páginas 21 y 22)  -->
        <!-- ============================================== -->
        @if (profileService.activeSubTab() === 'settings') {
          <div class="tab-panel fade-in">
            <!-- Sección 1: Cambio de Nombre de Usuario (Página 21) -->
            <div class="settings-card">
              <div class="card-header-icon">
                <span>✏️</span>
                <div>
                  <h3>Cambio de Nombre de Usuario (Página 21)</h3>
                  <p>Modifica tu apodo visible en el mapa y la tabla de la liga semanal.</p>
                </div>
              </div>

              <div class="username-change-form">
                <div class="form-row">
                  <input 
                    type="text" 
                    class="input-username"
                    [(ngModel)]="newUsernameInput"
                    placeholder="Nuevo apodo (ej. Explorador_Vamoo)"
                    maxlength="18"
                  />
                  <button 
                    class="btn-save-username"
                    (click)="submitUsernameChange()"
                  >
                    Guardar Cambio
                  </button>
                </div>

                <div class="cooldown-notice">
                  @if (profileService.usernameChangeInfo().canChangeNow) {
                    <span class="cooldown-tag ready">✓ Cambio disponible inmediatamente</span>
                  } @else {
                    <span class="cooldown-tag waiting">
                      ⏳ Próximo cambio disponible en {{ profileService.usernameChangeInfo().daysRemainingForNextChange }} días
                    </span>
                    <button class="btn-cooldown-reset" (click)="profileService.resetUsernameCooldownForTesting()">
                      🛠️ Resetear Espera (Simulación)
                    </button>
                  }
                </div>
              </div>
            </div>

            <!-- Sección 2: Ajustes de Privacidad (Página 22) -->
            <div class="settings-card">
              <div class="card-header-icon">
                <span>🛡️</span>
                <div>
                  <h3>Privacidad del Perfil (Página 22)</h3>
                  <p>Controla qué información pueden ver otros exploradores en las clasificaciones.</p>
                </div>
              </div>

              <div class="privacy-toggles-list">
                <label class="toggle-row">
                  <input 
                    type="checkbox" 
                    [checked]="profileService.privacySettings().isPublicProfile"
                    (change)="togglePublicProfile($event)"
                  />
                  <div class="toggle-text">
                    <strong>Habilitar Perfil Público Limitado</strong>
                    <small>Permite que tu nickname, avatar y rango aparezcan en el podio de la liga.</small>
                  </div>
                </label>

                <label class="toggle-row">
                  <input 
                    type="checkbox" 
                    [checked]="profileService.privacySettings().showBadges"
                    (change)="toggleShowBadges($event)"
                  />
                  <div class="toggle-text">
                    <strong>Mostrar Colección de Insignias</strong>
                    <small>Otros jugadores pueden ver las insignias patrimoniales que has obtenido.</small>
                  </div>
                </label>

                <label class="toggle-row">
                  <input 
                    type="checkbox" 
                    [checked]="profileService.privacySettings().showStats"
                    (change)="toggleShowStats($event)"
                  />
                  <div class="toggle-text">
                    <strong>Mostrar Estadísticas Semanales</strong>
                    <small>Muestra el total de kilómetros caminados en la tabla de la división.</small>
                  </div>
                </label>
              </div>

              <div class="privacy-guarantee-box">
                <span class="guarantee-icon">🔒</span>
                <div>
                  <strong>Garantía de Privacidad Vamoo:</strong>
                  <p>Tu ubicación GPS exacta en tiempo real y tu correo electrónico <strong>nunca se hacen públicos</strong>.</p>
                </div>
              </div>
            </div>

            <!-- Sección 3: Seguridad y Cierre de Sesión -->
            <div class="settings-card logout-card">
              <div class="card-header-icon">
                <span>🚪</span>
                <div>
                  <h3>Sesión de Usuario</h3>
                  <p>Gestiona tu acceso a la plataforma Vamoo.</p>
                </div>
              </div>

              <div class="logout-action-row">
                <button class="btn-logout-full" (click)="authService.logout()">
                  Cerrar Sesión Segura
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      background: #f8fafc;
      min-height: calc(100vh - 100px);
      padding: 24px 16px 60px 16px;
    }
    .profile-container {
      max-width: 1080px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Hero Card */
    .profile-hero-card {
      background: #ffffff;
      border-radius: var(--radius-xl);
      padding: 28px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 25px rgba(15, 23, 42, 0.05);
    }
    .hero-main-row {
      display: flex;
      align-items: center;
      gap: 28px;
      flex-wrap: wrap;
    }

    .avatar-stage {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .avatar-glow-ring {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
    }
    .avatar-circle-frame {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      border: 4px solid var(--color-primary);
      overflow: hidden;
      box-shadow: 0 8px 25px rgba(92, 71, 255, 0.25);
      background: #ffffff;
    }
    .avatar-base-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .equipped-hat-pill, .equipped-pin-pill {
      font-size: 0.68rem;
      font-weight: 800;
      background: #0f172a;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: var(--radius-pill);
      margin-top: 4px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    .equipped-pin-pill { background: #4f46e5; }

    .identity-info { flex: 1; min-width: 280px; }
    .badge-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 6px; }
    .user-handle { font-size: 0.8rem; font-weight: 800; color: #64748b; }
    .rank-tag-hero {
      background: #e0e7ff;
      color: #4338ca;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: var(--radius-pill);
    }
    .pass-tag {
      background: #ecfdf5;
      color: #065f46;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: var(--radius-pill);
    }

    .user-display-name {
      font-size: 1.85rem;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .user-email-meta {
      font-size: 0.84rem;
      color: #64748b;
      margin: 0 0 10px 0;
    }

    .xp-strip {
      display: flex;
      gap: 16px;
      font-size: 0.85rem;
      color: #334155;
    }
    .xp-count strong { color: var(--color-primary); }
    .league-pos strong { color: #059669; }

    .hero-actions { display: flex; flex-direction: column; gap: 8px; }
    .btn-subnav-quick {
      padding: 8px 16px;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-md);
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
    }
    .btn-subnav-quick.settings { background: #ffffff; }

    /* Sub Tabs Nav */
    .profile-tabs-nav {
      display: flex;
      gap: 8px;
      background: #e2e8f0;
      padding: 6px;
      border-radius: var(--radius-lg);
      overflow-x: auto;
    }
    .tab-btn {
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
      font-size: 0.86rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }
    .tab-btn.active {
      background: #ffffff;
      color: var(--color-primary);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    /* Tab 1: Summary */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .metric-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-xl);
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
    }
    .metric-icon { font-size: 1.8rem; margin-bottom: 2px; }
    .metric-val { font-size: 1.6rem; font-weight: 900; color: #0f172a; }
    .metric-lbl { font-size: 0.74rem; font-weight: 700; color: #64748b; text-transform: uppercase; }

    .pass-card {
      background: linear-gradient(135deg, #1e1b4b, #312e81);
      color: #ffffff;
      border-radius: var(--radius-xl);
      padding: 24px;
      margin-top: 16px;
      box-shadow: 0 8px 30px rgba(49, 46, 129, 0.2);
    }
    .pass-header { display: flex; justify-content: space-between; align-items: center; }
    .pass-badge { font-size: 0.7rem; font-weight: 800; color: #a5b4fc; letter-spacing: 0.05em; }
    .pass-header h2 { margin: 2px 0 0 0; font-size: 1.35rem; }
    .pass-icon { font-size: 2.2rem; }
    .pass-perks-row { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 12px; font-size: 0.8rem; color: #c7d2fe; }

    /* Tab 2: Wardrobe */
    .wardrobe-layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 20px;
    }
    .wardrobe-preview-col {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-xl);
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .wardrobe-stage { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .avatar-big-glow {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
    }
    .avatar-big-frame {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      border: 5px solid var(--color-primary);
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(92, 71, 255, 0.3);
      background: #ffffff;
    }
    .avatar-big-img { width: 100%; height: 100%; object-fit: cover; }

    .equipped-readout {
      width: 100%;
      background: #f8fafc;
      padding: 12px;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.78rem;
    }
    .readout-item { display: flex; justify-content: space-between; }
    .readout-item .lbl { color: #64748b; }

    .wardrobe-catalog-col {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-xl);
      padding: 24px;
    }
    .catalog-header h2 { margin: 0 0 4px 0; font-size: 1.25rem; color: #0f172a; }
    .catalog-header p { margin: 0 0 16px 0; font-size: 0.84rem; color: #64748b; }
    .cat-label { font-size: 0.78rem; font-weight: 800; color: #475569; display: block; margin-bottom: 10px; }

    .options-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
    }
    .wardrobe-item-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      border: 1.5px solid #e2e8f0;
      background: #ffffff;
      cursor: pointer;
      transition: all 0.15s;
    }
    .wardrobe-item-card.unlocked:hover {
      border-color: var(--color-primary);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(92, 71, 255, 0.15);
    }
    .wardrobe-item-card.locked { opacity: 0.6; cursor: not-allowed; background: #f8fafc; }

    .item-icon-box { font-size: 1.4rem; }
    .color-swatch { width: 24px; height: 24px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 4px rgba(0, 0, 0, 0.2); }
    .item-text-box { display: flex; flex-direction: column; }
    .item-name { font-size: 0.82rem; color: #0f172a; }
    .item-condition { font-size: 0.7rem; }
    .text-unlocked { color: #059669; font-weight: 700; }
    .text-locked { color: #94a3b8; }

    /* Tab 3: Stats */
    .stats-panel-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-xl);
      padding: 24px;
    }
    .stats-panel-card h2 { margin: 0 0 4px 0; font-size: 1.25rem; color: #0f172a; }
    .stats-panel-card p { margin: 0 0 16px 0; font-size: 0.84rem; color: #64748b; }
    .stats-breakdown-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
    }
    .breakdown-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-lg);
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .box-icon { font-size: 1.6rem; }
    .box-val { font-size: 1.35rem; font-weight: 900; color: #0f172a; }
    .box-lbl { font-size: 0.72rem; color: #64748b; font-weight: 700; }

    /* Tab 4: Settings */
    .settings-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-xl);
      padding: 24px;
      margin-bottom: 16px;
    }
    .card-header-icon { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 16px; }
    .card-header-icon span { font-size: 1.6rem; }
    .card-header-icon h3 { margin: 0; font-size: 1.15rem; color: #0f172a; }
    .card-header-icon p { margin: 2px 0 0 0; font-size: 0.82rem; color: #64748b; }

    .username-change-form { display: flex; flex-direction: column; gap: 10px; }
    .form-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .input-username {
      flex: 1;
      min-width: 240px;
      padding: 10px 14px;
      border: 1.5px solid #cbd5e1;
      border-radius: var(--radius-md);
      font-size: 0.88rem;
    }
    .btn-save-username {
      padding: 10px 18px;
      background: var(--color-primary);
      color: #ffffff;
      border: none;
      border-radius: var(--radius-md);
      font-weight: 800;
      font-size: 0.84rem;
      cursor: pointer;
    }

    .cooldown-notice { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 0.78rem; }
    .cooldown-tag.ready { color: #059669; font-weight: 700; }
    .cooldown-tag.waiting { color: #d97706; font-weight: 700; }
    .btn-cooldown-reset {
      background: #f1f5f9;
      border: 1px dashed #94a3b8;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.72rem;
      cursor: pointer;
    }

    .privacy-toggles-list { display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px; }
    .toggle-row { display: flex; gap: 12px; align-items: flex-start; cursor: pointer; }
    .toggle-row input { margin-top: 3px; transform: scale(1.15); }
    .toggle-text { display: flex; flex-direction: column; font-size: 0.84rem; }
    .toggle-text small { color: #64748b; }

    .privacy-guarantee-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: var(--radius-md);
      padding: 12px 16px;
      display: flex;
      gap: 12px;
      align-items: center;
      font-size: 0.8rem;
      color: #1e40af;
    }
    .guarantee-icon { font-size: 1.4rem; }
    .privacy-guarantee-box p { margin: 2px 0 0 0; }

    .btn-logout-full {
      padding: 10px 20px;
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
      border-radius: var(--radius-md);
      font-weight: 800;
      font-size: 0.86rem;
      cursor: pointer;
    }

    .feedback-toast {
      padding: 10px 18px;
      border-radius: var(--radius-md);
      font-size: 0.86rem;
      font-weight: 700;
      color: #ffffff;
    }
    .feedback-toast.info { background: #3b82f6; }
    .feedback-toast.success { background: #10b981; }
    .feedback-toast.warn { background: #f59e0b; }
    .feedback-toast.error { background: #ef4444; }

    @media (max-width: 768px) {
      .wardrobe-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class ProfileComponent {
  profileService = inject(ProfileService);
  sessionService = inject(SessionService);
  authService = inject(AuthService);

  newUsernameInput: string = '';

  submitUsernameChange(): void {
    if (!this.newUsernameInput) return;
    const res = this.profileService.changeUsername(this.newUsernameInput);
    if (res.success) {
      this.newUsernameInput = '';
    }
  }

  togglePublicProfile(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.profileService.updatePrivacySettings({ isPublicProfile: checked });
  }

  toggleShowBadges(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.profileService.updatePrivacySettings({ showBadges: checked });
  }

  toggleShowStats(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.profileService.updatePrivacySettings({ showStats: checked });
  }
}
