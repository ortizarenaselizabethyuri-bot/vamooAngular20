import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';
import { AuthMode, AuthMethod } from '../../../core/models/auth.model';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-backdrop" (click)="closeModal()">
      <div class="auth-card" (click)="$event.stopPropagation()">
        
        <!-- Header con selector de acción raíz: "¿Qué desea hacer?" -->
        <div class="card-header">
          <div class="header-brand">
            <span class="brand-icon">🧭</span>
            <div>
              <span class="brand-title">Vamoo</span>
              <span class="brand-badge">Módulo 02 • Autenticación</span>
            </div>
          </div>
          <button class="btn-close" (click)="closeModal()" title="Cerrar modal">✕</button>
        </div>

        <!-- Barra de decisión raíz: [ Ingresar | Registro | Recuperar ] -->
        <div class="decision-tabs" role="tablist">
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="authService.authMode() === 'login'"
            (click)="authService.setAuthMode('login')"
          >
            <span class="tab-icon">🔑</span>
            <span>Ingresar</span>
          </button>

          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="authService.authMode() === 'register'"
            (click)="authService.setAuthMode('register')"
          >
            <span class="tab-icon">✨</span>
            <span>Registro</span>
          </button>

          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="authService.authMode() === 'recovery'"
            (click)="authService.setAuthMode('recovery')"
          >
            <span class="tab-icon">🛡️</span>
            <span>Recuperar</span>
          </button>
        </div>

        <!-- Mascota Vamoo Mini Helper -->
        <div class="mascot-tip-bar">
          <img src="/assets/mascot.jpg" alt="Vamoo" class="tip-avatar" />
          <div class="tip-speech">
            @switch (authService.authMode()) {
              @case ('login') {
                <span><strong>¡Hola de nuevo!</strong> Ingresa tus credenciales para continuar tu travesía.</span>
              }
              @case ('register') {
                @if (authService.registrationStep() === 'age_denied') {
                  <span><strong>¡Atención!</strong> Debes tener al menos 14 años para registrarte solo.</span>
                } @else if (authService.registrationStep() === 'otp_verification') {
                  <span><strong>¡Casi listo!</strong> Revisa el código OTP que enviamos a tu correo.</span>
                } @else {
                  <span><strong>¡Únete a la aventura!</strong> Elige un nombre épico y tu fecha de nacimiento.</span>
                }
              }
              @case ('recovery') {
                <span><strong>¿Olvidaste tu llave?</strong> Te ayudamos a restablecer tu contraseña en minutos.</span>
              }
            }
          </div>
        </div>

        <!-- Alertas de estado y error -->
        @if (authService.errorMessage()) {
          <div class="alert alert-error">
            <span class="alert-icon">⚠️</span>
            <span>{{ authService.errorMessage() }}</span>
          </div>
        }

        @if (authService.successMessage()) {
          <div class="alert alert-success">
            <span class="alert-icon">✅</span>
            <span>{{ authService.successMessage() }}</span>
          </div>
        }

        <!-- ========================================== -->
        <!-- PESTAÑA 1: INGRESAR (INICIAR SESIÓN)       -->
        <!-- ========================================== -->
        @if (authService.authMode() === 'login') {
          <div class="tab-content fade-in">
            <!-- Bloqueo de seguridad por intentos fallidos -->
            @if (authService.isLockedOut()) {
              <div class="lockout-card">
                <div class="lockout-icon">🔒</div>
                <h3>Acceso Bloqueado Temporalmente</h3>
                <p>
                  Has superado el límite de 3 intentos fallidos permitidos.
                  Por tu seguridad, el sistema se reactivará en:
                </p>
                <div class="countdown-circle">
                  <span>{{ authService.lockoutSecondsRemaining() }}s</span>
                </div>
                <button type="button" class="btn-link-dev" (click)="authService.resetLockout()">
                  ⚡ Desbloquear ahora (Modo Prueba Dev)
                </button>
              </div>
            } @else {
              <!-- Selector de método: ¿Método? [ Contraseña / Google ] -->
              <div class="method-toggle">
                <button 
                  type="button" 
                  class="method-btn" 
                  [class.active]="authService.authMethod() === 'email'"
                  (click)="authService.setAuthMethod('email')"
                >
                  ✉️ Correo o Usuario
                </button>
                <button 
                  type="button" 
                  class="method-btn" 
                  [class.active]="authService.authMethod() === 'google'"
                  (click)="authService.setAuthMethod('google')"
                >
                  <svg class="google-svg" viewBox="0 0 24 24" width="16" height="16">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.15C3.25 21.36 7.35 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.64 1.27 6.61l4 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/>
                  </svg>
                  Google
                </button>
              </div>

              <!-- Método A: Contraseña (Correo o Usuario) -->
              @if (authService.authMethod() === 'email') {
                <form (ngSubmit)="handleLoginSubmit()" class="auth-form">
                  <div class="form-group">
                    <label for="login-id">Usuario o Correo Electrónico</label>
                    <div class="input-with-icon">
                      <span class="icon">👤</span>
                      <input 
                        id="login-id" 
                        type="text" 
                        [(ngModel)]="loginIdentifier" 
                        name="loginIdentifier"
                        placeholder="ej. explorador o tú@correo.com"
                        required
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <div class="label-row">
                      <label for="login-pwd">Contraseña</label>
                      <button type="button" class="btn-link" (click)="authService.setAuthMode('recovery')">
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                    <div class="input-with-icon">
                      <span class="icon">🔒</span>
                      <input 
                        id="login-pwd" 
                        [type]="showPassword() ? 'text' : 'password'" 
                        [(ngModel)]="loginPassword" 
                        name="loginPassword"
                        placeholder="••••••••"
                        required
                      />
                      <button type="button" class="btn-eye" (click)="showPassword.set(!showPassword())">
                        {{ showPassword() ? '👁️' : '👁️‍🗨️' }}
                      </button>
                    </div>
                  </div>

                  <!-- Caso de uso UML: Mantener sesión -->
                  <div class="checkbox-row">
                    <label class="custom-checkbox">
                      <input 
                        type="checkbox" 
                        [checked]="authService.rememberMe()" 
                        (change)="toggleRememberMe($event)"
                      />
                      <span class="checkmark"></span>
                      <span class="label-text">Mantener sesión iniciada</span>
                    </label>
                    
                    @if (authService.failedLoginAttempts() > 0) {
                      <span class="badge-attempts">
                        ⚠️ Te quedan {{ authService.attemptsRemaining() }} {{ authService.attemptsRemaining() === 1 ? 'intento' : 'intentos' }}
                      </span>
                    }
                  </div>

                  <button 
                    type="submit" 
                    class="btn-submit primary"
                    [disabled]="authService.isProcessing()"
                  >
                    @if (authService.isProcessing()) {
                      <span class="spinner"></span> Validando acceso...
                    } @else {
                      <span>Ingresar a Vamoo</span>
                      <span class="arrow">➔</span>
                    }
                  </button>

                  <!-- Botón de prueba rápida con credenciales predefinidas -->
                  <div class="quick-fill-bar">
                    <button type="button" class="btn-quick-fill" (click)="quickFillCredentials()">
                      ⚡ Rellenar cuenta de prueba: <em>explorador / Vamoo2026!</em>
                    </button>
                  </div>
                </form>
              }

              <!-- Método B: Google (Validar Identidad Google) -->
              @if (authService.authMethod() === 'google') {
                <div class="google-auth-box">
                  <div class="google-account-card">
                    <img src="https://lh3.googleusercontent.com/a/default-user" alt="Google Avatar" class="google-avatar" />
                    <div class="google-info">
                      <strong>César Explorador</strong>
                      <span>cicaa.explorador@gmail.com</span>
                    </div>
                    <span class="google-check">✓ Verificado</span>
                  </div>

                  <p class="google-hint">
                    Se validará tu identidad mediante los servicios seguros de Google OAuth.
                  </p>

                  <button 
                    type="button" 
                    class="btn-submit google-btn"
                    (click)="handleGoogleLogin()"
                    [disabled]="authService.isProcessing()"
                  >
                    @if (authService.isProcessing()) {
                      <span class="spinner"></span> Validando con Google...
                    } @else {
                      <span>Continuar con cicaa.explorador&#64;gmail.com</span>
                    }
                  </button>
                </div>
              }
            }
          </div>
        }

        <!-- ========================================== -->
        <!-- PESTAÑA 2: REGISTRO (CREAR CUENTA)         -->
        <!-- ========================================== -->
        @if (authService.authMode() === 'register') {
          <div class="tab-content fade-in">
            <!-- Selector de método: [ Correo | Google ] -->
            <div class="method-toggle">
              <button 
                type="button" 
                class="method-btn" 
                [class.active]="authService.authMethod() === 'email'"
                (click)="authService.setAuthMethod('email')"
              >
                ✉️ Registro con Correo
              </button>
              <button 
                type="button" 
                class="method-btn" 
                [class.active]="authService.authMethod() === 'google'"
                (click)="authService.setAuthMethod('google')"
              >
                <svg class="google-svg" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.15C3.25 21.36 7.35 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.64 1.27 6.61l4 3.15c.95-2.85 3.6-4.96 6.73-4.96z"/>
                </svg>
                Google
              </button>
            </div>

            <!-- Paso A: Completar formulario con validación de edad y nombre único -->
            @if (authService.registrationStep() === 'email_form') {
              <form (ngSubmit)="handleRegisterSubmit()" class="auth-form">
                <div class="form-row">
                  <div class="form-group flex-1">
                    <label for="reg-email">Correo Electrónico</label>
                    <input 
                      id="reg-email" 
                      type="email" 
                      [(ngModel)]="registerEmail" 
                      name="registerEmail"
                      placeholder="tu@correo.com"
                      required
                    />
                  </div>

                  <div class="form-group flex-1">
                    <label for="reg-username">Nombre Único de Explorador</label>
                    <div class="input-with-status">
                      <input 
                        id="reg-username" 
                        type="text" 
                        [(ngModel)]="registerUsername" 
                        name="registerUsername"
                        placeholder="ej. valiente_99"
                        required
                        (input)="checkUsernamePreview()"
                      />
                      @if (isCheckingUsername()) {
                        <span class="status-indicator checking">⏳</span>
                      } @else if (registerUsername.length >= 3) {
                        <span class="status-indicator available">✓</span>
                      }
                    </div>
                  </div>
                </div>

                <!-- Validación de Edad (Diagrama 2: "¿Edad admitida?") -->
                <div class="form-row">
                  <div class="form-group flex-1">
                    <label for="reg-birth">Fecha de Nacimiento</label>
                    <input 
                      id="reg-birth" 
                      type="date" 
                      [(ngModel)]="registerBirthDate" 
                      name="registerBirthDate"
                      (change)="calculateAgeFromDate()"
                      required
                    />
                  </div>
                  <div class="form-group flex-1">
                    <label for="reg-age">Edad Calculada</label>
                    <div class="age-pill" [class.age-valid]="calculatedAge >= 14" [class.age-invalid]="calculatedAge > 0 && calculatedAge < 14">
                      <span>{{ calculatedAge > 0 ? calculatedAge + ' años' : 'Ingresa fecha' }}</span>
                      <small>{{ calculatedAge >= 14 ? '(Permitido)' : (calculatedAge > 0 ? '(Mínimo 14 años)' : '') }}</small>
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group flex-1">
                    <label for="reg-pwd">Contraseña</label>
                    <input 
                      id="reg-pwd" 
                      type="password" 
                      [(ngModel)]="registerPassword" 
                      name="registerPassword"
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>
                  <div class="form-group flex-1">
                    <label for="reg-confirm-pwd">Confirmar Contraseña</label>
                    <input 
                      id="reg-confirm-pwd" 
                      type="password" 
                      [(ngModel)]="registerConfirmPassword" 
                      name="registerConfirmPassword"
                      placeholder="Repite la contraseña"
                      required
                    />
                  </div>
                </div>

                <div class="checkbox-row">
                  <label class="custom-checkbox">
                    <input type="checkbox" [(ngModel)]="acceptTerms" name="acceptTerms" required />
                    <span class="checkmark"></span>
                    <span class="label-text">
                      Acepto las <a href="javascript:void(0)" (click)="openPrivacy()">Políticas de Privacidad</a> de Vamoo
                    </span>
                  </label>
                </div>

                <button 
                  type="submit" 
                  class="btn-submit primary"
                  [disabled]="authService.isProcessing() || !acceptTerms"
                >
                  <span>Continuar y Verificar</span>
                  <span class="arrow">➔</span>
                </button>
              </form>
            }

            <!-- Paso B: Denegar Registro - Fin sin registro (Diagrama 2) -->
            @if (authService.registrationStep() === 'age_denied') {
              <div class="age-denied-box">
                <div class="denied-icon">🛡️</div>
                <h3>Registro Denegado por Edad</h3>
                <p class="denied-desc">
                  Vamoo promueve la exploración física segura en la ciudad.
                  Para crear una cuenta propia debes tener <strong>al menos 14 años</strong> de edad.
                </p>
                <div class="denied-tip">
                  💡 <em>¡No te preocupes! Pide a un adulto, hermano mayor o tutor que juegue contigo.</em>
                </div>
                <div class="denied-actions">
                  <button type="button" class="btn-secondary" (click)="authService.registrationStep.set('email_form')">
                    ← Modificar fecha de nacimiento
                  </button>
                  <button type="button" class="btn-outline" (click)="closeModal()">
                    Volver a Portada como Visitante
                  </button>
                </div>
              </div>
            }

            <!-- Paso C: Nombre No Disponible - Solicitar otro nombre (Diagrama 2) -->
            @if (authService.registrationStep() === 'username_taken') {
              <div class="username-taken-box">
                <div class="taken-icon">⚠️</div>
                <h3>El nombre '{{ registerUsername }}' ya está en uso</h3>
                <p>
                  Cada explorador en Vamoo debe tener una identidad única en el mapa y en las ligas semanales.
                </p>
                <div class="suggestions-list">
                  <span class="suggestions-label">Sugerencias disponibles para ti:</span>
                  <div class="tags-row">
                    @for (sug of authService.usernameSuggestions(); track sug) {
                      <button type="button" class="suggestion-tag" (click)="applySuggestedUsername(sug)">
                        ✨ {{ sug }}
                      </button>
                    }
                  </div>
                </div>
                <button type="button" class="btn-secondary" (click)="authService.registrationStep.set('email_form')">
                  ← Probar otro nombre manualmente
                </button>
              </div>
            }

            <!-- Paso D: Enviar y Verificar Código (OTP) por Correo (Diagrama 2) -->
            @if (authService.registrationStep() === 'otp_verification') {
              <div class="otp-box">
                <div class="otp-icon">📬</div>
                <h3>Verifica tu Correo Electrónico</h3>
                <p>
                  Hemos enviado un código de seguridad de 6 dígitos a:
                  <strong>{{ registerEmail }}</strong>
                </p>

                <!-- Bandeja simulada interactiva para máxima facilidad de prueba -->
                @if (authService.simulatedEmailInbox(); as inbox) {
                  <div class="simulated-inbox-card">
                    <div class="inbox-header">
                      <span class="inbox-badge">Simulador de Proveedor de Correo</span>
                      <span class="inbox-time">Ahora</span>
                    </div>
                    <div class="inbox-content">
                      <strong>{{ inbox.subject }}</strong>
                      <div class="inbox-code-row">
                        <span class="inbox-code">{{ inbox.code }}</span>
                        <button type="button" class="btn-copy-code" (click)="autoFillOtp(inbox.code)">
                          ⚡ Pegar código automáticamente
                        </button>
                      </div>
                    </div>
                  </div>
                }

                <div class="otp-inputs-row">
                  <input 
                    type="text" 
                    maxlength="6" 
                    [(ngModel)]="otpCodeInput" 
                    placeholder="000000"
                    class="otp-main-input"
                  />
                </div>

                <div class="resend-row">
                  @if (authService.otpCountdown() > 0) {
                    <span class="resend-timer">
                      Reenviar código en {{ authService.otpCountdown() }}s
                    </span>
                  } @else {
                    <button type="button" class="btn-resend" (click)="authService.resendRegistrationOtp()">
                      🔄 Reenviar código ahora
                    </button>
                  }
                </div>

                <button 
                  type="button" 
                  class="btn-submit primary"
                  [disabled]="authService.isProcessing() || otpCodeInput.length < 6"
                  (click)="handleVerifyOtpSubmit()"
                >
                  @if (authService.isProcessing()) {
                    <span class="spinner"></span> Verificando código...
                  } @else {
                    <span>Activar Cuenta y Entrar</span>
                    <span class="arrow">➔</span>
                  }
                </button>
              </div>
            }

            <!-- Paso E: Confirmar cuenta Google (Diagrama 2) -->
            @if (authService.registrationStep() === 'google_prompt') {
              <div class="google-confirm-box">
                <div class="google-icon-big">🌐</div>
                <h3>Registrarse con Cuenta Google</h3>
                <p>
                  Confirma tus datos para vincular tu identidad de Google con tu perfil de Vamoo:
                </p>

                <div class="google-user-summary">
                  <img src="https://lh3.googleusercontent.com/a/default-user" alt="Avatar" class="avatar-small" />
                  <div>
                    <strong>César Explorador</strong>
                    <span>cicaa.explorador@gmail.com</span>
                  </div>
                </div>

                <div class="form-group">
                  <label for="g-nickname">Tu Nombre de Explorador en Vamoo</label>
                  <input id="g-nickname" type="text" [(ngModel)]="googleNickname" placeholder="ej. cesar_vamoo" />
                </div>

                <div class="form-group">
                  <label for="g-age">Tu Edad</label>
                  <input id="g-age" type="number" [(ngModel)]="googleAge" placeholder="ej. 24" min="10" max="99" />
                </div>

                <button 
                  type="button" 
                  class="btn-submit google-btn"
                  [disabled]="authService.isProcessing()"
                  (click)="handleGoogleRegisterSubmit()"
                >
                  @if (authService.isProcessing()) {
                    <span class="spinner"></span> Activando cuenta...
                  } @else {
                    <span>Confirmar y Activar con Google</span>
                  }
                </button>
              </div>
            }

            <!-- Paso F: Cuenta Activada con éxito (Diagrama 2) -->
            @if (authService.registrationStep() === 'account_activated') {
              <div class="activated-box">
                <div class="activated-icon">🎉</div>
                <h3>¡Cuenta Activada con Éxito!</h3>
                <p>
                  Tu perfil ha sido verificado. Iniciando sesión y preparando tu aventura...
                </p>
                <div class="progress-bar-animated">
                  <div class="progress-fill"></div>
                </div>
              </div>
            }
          </div>
        }

        <!-- ========================================== -->
        <!-- PESTAÑA 3: RECUPERAR CONTRASEÑA            -->
        <!-- ========================================== -->
        @if (authService.authMode() === 'recovery') {
          <div class="tab-content fade-in">
            <!-- Paso 1: Recuperación por correo (Diagrama 2) -->
            @if (authService.recoveryStep() === 'request_email') {
              <form (ngSubmit)="handleRequestRecoverySubmit()" class="auth-form">
                <div class="step-badge">Paso 1 de 2 • Solicitud de Código</div>
                <h3>Recupera el acceso a tu cuenta</h3>
                <p class="section-desc">
                  Ingresa el correo electrónico asociado a tu cuenta. Te enviaremos un código de seguridad para crear una nueva clave.
                </p>

                <div class="form-group">
                  <label for="rec-email">Correo Electrónico Registrado</label>
                  <div class="input-with-icon">
                    <span class="icon">✉️</span>
                    <input 
                      id="rec-email" 
                      type="email" 
                      [(ngModel)]="recoveryEmail" 
                      name="recoveryEmail"
                      placeholder="explorador@vamoo.app"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  class="btn-submit primary"
                  [disabled]="authService.isProcessing()"
                >
                  @if (authService.isProcessing()) {
                    <span class="spinner"></span> Enviando código...
                  } @else {
                    <span>Enviar Código de Recuperación</span>
                    <span class="arrow">➔</span>
                  }
                </button>

                <div class="quick-fill-bar">
                  <button type="button" class="btn-quick-fill" (click)="recoveryEmail = 'explorador@vamoo.app'">
                    ⚡ Usar correo de prueba: <em>explorador&#64;vamoo.app</em>
                  </button>
                </div>
              </form>
            }

            <!-- Paso 2: Verificar código y actualizar contraseña (Diagrama 2) -->
            @if (authService.recoveryStep() === 'otp_and_new_password') {
              <form (ngSubmit)="handleResetPasswordSubmit()" class="auth-form">
                <div class="step-badge">Paso 2 de 2 • Restablecer Contraseña</div>
                <h3>Ingresa el código y tu nueva clave</h3>
                <p class="section-desc">
                  Hemos enviado un código a <strong>{{ authService.pendingRecoveryEmail() }}</strong>.
                </p>

                <!-- Bandeja de correo simulada para recuperación -->
                @if (authService.simulatedEmailInbox(); as inbox) {
                  <div class="simulated-inbox-card">
                    <div class="inbox-header">
                      <span class="inbox-badge">Código Recibido</span>
                      <span class="inbox-time">Ahora</span>
                    </div>
                    <div class="inbox-content">
                      <div class="inbox-code-row">
                        <span class="inbox-code">{{ inbox.code }}</span>
                        <button type="button" class="btn-copy-code" (click)="recoveryOtpCode = inbox.code">
                          ⚡ Autocompletar código
                        </button>
                      </div>
                    </div>
                  </div>
                }

                <div class="form-group">
                  <label for="rec-code">Código de 6 dígitos</label>
                  <input 
                    id="rec-code" 
                    type="text" 
                    [(ngModel)]="recoveryOtpCode" 
                    name="recoveryOtpCode"
                    placeholder="ej. 749201"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="rec-new-pwd">Nueva Contraseña</label>
                  <input 
                    id="rec-new-pwd" 
                    type="password" 
                    [(ngModel)]="recoveryNewPassword" 
                    name="recoveryNewPassword"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="rec-confirm-pwd">Confirmar Nueva Contraseña</label>
                  <input 
                    id="rec-confirm-pwd" 
                    type="password" 
                    [(ngModel)]="recoveryConfirmPassword" 
                    name="recoveryConfirmPassword"
                    placeholder="Repite la nueva contraseña"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  class="btn-submit primary"
                  [disabled]="authService.isProcessing()"
                >
                  @if (authService.isProcessing()) {
                    <span class="spinner"></span> Actualizando contraseña...
                  } @else {
                    <span>Actualizar Contraseña y Volver</span>
                    <span class="arrow">➔</span>
                  }
                </button>
              </form>
            }

            <!-- Paso 3: Éxito -> Inicio -> Pantalla de autenticación (Diagrama 2) -->
            @if (authService.recoveryStep() === 'recovery_success') {
              <div class="activated-box">
                <div class="activated-icon">✨</div>
                <h3>¡Contraseña Actualizada!</h3>
                <p>
                  Tu clave ha sido modificada con éxito. Ya puedes ingresar al juego con tus nuevas credenciales.
                </p>
                <button type="button" class="btn-submit primary" (click)="authService.backToLogin()">
                  Ir a Iniciar Sesión ➔
                </button>
              </div>
            }
          </div>
        }

        <!-- Footer con términos y atajo a políticas -->
        <div class="card-footer">
          <span>Vamoo Seguridad &copy; 2026 •</span>
          <a href="javascript:void(0)" (click)="openPrivacy()">Privacidad y Cookies</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-backdrop {
      position: fixed;
      inset: 0;
      z-index: 300;
      background: rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: modalBackdropFade 0.25s ease-out;
    }

    .auth-card {
      background: #ffffff;
      border-radius: var(--radius-xl);
      max-width: 500px;
      width: 100%;
      max-height: 92vh;
      overflow-y: auto;
      padding: 24px 28px;
      box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.8);
      animation: modalContentPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-icon {
      font-size: 1.6rem;
    }

    .brand-title {
      font-family: var(--font-heading);
      font-weight: 800;
      font-size: 1.25rem;
      color: var(--color-primary);
      display: block;
      line-height: 1.1;
    }

    .brand-badge {
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.02em;
    }

    .btn-close {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      background: #f1f5f9;
      border: none;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-close:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    /* Pestañas de decisión raíz: "¿Qué desea hacer?" */
    .decision-tabs {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      background: #f1f5f9;
      padding: 4px;
      border-radius: var(--radius-md);
      margin-bottom: 14px;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      border: none;
      background: transparent;
      color: #64748b;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .tab-btn.active {
      background: #ffffff;
      color: var(--color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    .tab-icon {
      font-size: 0.95rem;
    }

    /* Mascota Vamoo Mini Helper */
    .mascot-tip-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, rgba(92, 71, 255, 0.06), rgba(0, 209, 178, 0.06));
      border: 1px solid rgba(92, 71, 255, 0.12);
      border-radius: var(--radius-md);
      padding: 8px 14px;
      margin-bottom: 16px;
    }
    .tip-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      object-fit: cover;
      box-shadow: 0 2px 8px rgba(92, 71, 255, 0.2);
    }
    .tip-speech {
      font-size: 0.8rem;
      color: #334155;
      line-height: 1.35;
    }

    /* Selector de Método: [ Correo / Google ] */
    .method-toggle {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .method-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 14px;
      border: 1.5px solid #e2e8f0;
      border-radius: var(--radius-md);
      background: #f8fafc;
      color: #475569;
      font-size: 0.86rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .method-btn.active {
      border-color: var(--color-primary);
      background: rgba(92, 71, 255, 0.05);
      color: var(--color-primary);
    }

    /* Formulario */
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .form-row {
      display: flex;
      gap: 12px;
    }
    .flex-1 {
      flex: 1;
    }

    label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #475569;
    }
    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    input[type="text"],
    input[type="email"],
    input[type="password"],
    input[type="date"],
    input[type="number"] {
      width: 100%;
      padding: 10px 14px;
      border: 1.5px solid #cbd5e1;
      border-radius: var(--radius-md);
      font-family: inherit;
      font-size: 0.9rem;
      color: #0f172a;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      background: #ffffff;
    }
    input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px rgba(92, 71, 255, 0.15);
    }

    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }
    .input-with-icon .icon {
      position: absolute;
      left: 12px;
      color: #94a3b8;
      pointer-events: none;
    }
    .input-with-icon input {
      padding-left: 38px;
    }
    .btn-eye {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .input-with-status {
      position: relative;
    }
    .status-indicator {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.85rem;
    }
    .status-indicator.available {
      color: #10b981;
      font-weight: bold;
    }

    .age-pill {
      padding: 10px 14px;
      border: 1.5px solid #cbd5e1;
      border-radius: var(--radius-md);
      background: #f8fafc;
      font-size: 0.86rem;
      font-weight: 700;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .age-pill.age-valid {
      border-color: #10b981;
      color: #065f46;
      background: #ecfdf5;
    }
    .age-pill.age-invalid {
      border-color: #ef4444;
      color: #991b1b;
      background: #fef2f2;
    }

    .checkbox-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 4px;
    }
    .custom-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 0.82rem;
      color: #475569;
    }
    .badge-attempts {
      font-size: 0.74rem;
      font-weight: 700;
      color: #b45309;
      background: #fef3c7;
      padding: 2px 8px;
      border-radius: var(--radius-pill);
    }

    .btn-submit {
      width: 100%;
      padding: 12px 20px;
      border-radius: var(--radius-md);
      font-weight: 700;
      font-size: 0.95rem;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all var(--transition-spring);
    }
    .btn-submit.primary {
      background: linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%);
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(92, 71, 255, 0.35);
    }
    .btn-submit.primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(92, 71, 255, 0.45);
    }
    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-submit.google-btn {
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      color: #1e293b;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .btn-submit.google-btn:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    .btn-link {
      background: none;
      border: none;
      color: var(--color-primary);
      font-size: 0.76rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
    }

    .btn-quick-fill {
      width: 100%;
      padding: 8px 12px;
      background: #f1f5f9;
      border: 1px dashed #cbd5e1;
      border-radius: var(--radius-sm);
      color: #475569;
      font-size: 0.78rem;
      cursor: pointer;
      text-align: center;
      margin-top: 6px;
    }
    .btn-quick-fill:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    /* Bloqueo por intentos */
    .lockout-card {
      text-align: center;
      padding: 24px 16px;
      background: #fff1f2;
      border: 1.5px solid #fecdd3;
      border-radius: var(--radius-lg);
    }
    .lockout-icon {
      font-size: 2.4rem;
      margin-bottom: 8px;
    }
    .countdown-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #e11d48;
      color: #ffffff;
      font-size: 1.3rem;
      font-weight: 800;
      margin: 14px 0;
      box-shadow: 0 4px 15px rgba(225, 29, 72, 0.4);
    }
    .btn-link-dev {
      background: none;
      border: none;
      color: #e11d48;
      font-size: 0.78rem;
      font-weight: 700;
      text-decoration: underline;
      cursor: pointer;
      display: block;
      margin: 0 auto;
    }

    /* Google Auth Selector */
    .google-account-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: var(--radius-md);
      margin-bottom: 12px;
    }
    .google-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
    .google-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      font-size: 0.85rem;
    }
    .google-check {
      font-size: 0.76rem;
      color: #10b981;
      font-weight: 700;
    }
    .google-hint {
      font-size: 0.8rem;
      color: #64748b;
      margin-bottom: 16px;
      line-height: 1.4;
    }

    /* Edad denegada */
    .age-denied-box {
      text-align: center;
      padding: 24px 16px;
      background: #fffbeb;
      border: 1.5px solid #fde68a;
      border-radius: var(--radius-lg);
    }
    .denied-icon {
      font-size: 2.4rem;
      margin-bottom: 8px;
    }
    .denied-desc {
      font-size: 0.9rem;
      color: #78350f;
      line-height: 1.5;
      margin-bottom: 12px;
    }
    .denied-tip {
      font-size: 0.82rem;
      color: #92400e;
      background: #fef3c7;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      margin-bottom: 18px;
    }
    .denied-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* Nombre tomado */
    .username-taken-box {
      text-align: center;
      padding: 20px 14px;
      background: #fef2f2;
      border: 1.5px solid #fecaca;
      border-radius: var(--radius-lg);
    }
    .taken-icon {
      font-size: 2.2rem;
      margin-bottom: 6px;
    }
    .suggestions-list {
      margin: 14px 0;
    }
    .suggestions-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #475569;
      display: block;
      margin-bottom: 8px;
    }
    .tags-row {
      display: flex;
      gap: 8px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .suggestion-tag {
      padding: 6px 12px;
      background: #ffffff;
      border: 1.5px solid var(--color-primary);
      border-radius: var(--radius-pill);
      color: var(--color-primary);
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }
    .suggestion-tag:hover {
      background: var(--color-primary);
      color: #ffffff;
    }

    /* OTP Screen */
    .otp-box {
      text-align: center;
      padding: 12px 4px;
    }
    .otp-icon {
      font-size: 2.2rem;
      margin-bottom: 6px;
    }
    .simulated-inbox-card {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: var(--radius-md);
      padding: 12px 14px;
      margin: 16px 0;
      text-align: left;
    }
    .inbox-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .inbox-badge {
      font-size: 0.72rem;
      font-weight: 800;
      color: #4f46e5;
      background: #e0e7ff;
      padding: 2px 8px;
      border-radius: var(--radius-pill);
    }
    .inbox-time {
      font-size: 0.7rem;
      color: #94a3b8;
    }
    .inbox-code-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 8px;
    }
    .inbox-code {
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: 0.25em;
      color: #0f172a;
      font-family: monospace;
    }
    .btn-copy-code {
      padding: 6px 12px;
      background: #10b981;
      color: #ffffff;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.76rem;
      font-weight: 700;
      cursor: pointer;
    }

    .otp-main-input {
      font-size: 1.8rem;
      letter-spacing: 0.4em;
      text-align: center;
      font-family: monospace;
      padding: 12px !important;
      margin: 10px 0;
    }

    .resend-row {
      margin-bottom: 18px;
      font-size: 0.8rem;
    }
    .resend-timer {
      color: #94a3b8;
    }
    .btn-resend {
      background: none;
      border: none;
      color: var(--color-primary);
      font-weight: 700;
      cursor: pointer;
      text-decoration: underline;
    }

    /* Google Confirm */
    .google-confirm-box {
      text-align: center;
    }
    .google-icon-big {
      font-size: 2.2rem;
      margin-bottom: 6px;
    }
    .google-user-summary {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: var(--radius-md);
      margin: 14px 0;
      text-align: left;
    }
    .avatar-small {
      width: 36px;
      height: 36px;
      border-radius: 50%;
    }

    /* Cuenta Activada */
    .activated-box {
      text-align: center;
      padding: 30px 16px;
    }
    .activated-icon {
      font-size: 3rem;
      margin-bottom: 12px;
      animation: bounce 1s infinite;
    }
    .progress-bar-animated {
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
      margin-top: 20px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #06b6d4);
      width: 100%;
      animation: progressSweep 1.2s ease-in-out infinite;
    }

    /* Alertas */
    .alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      font-size: 0.82rem;
      margin-bottom: 14px;
      line-height: 1.4;
    }
    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .alert-success {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }

    /* Footer */
    .card-footer {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 6px;
      font-size: 0.74rem;
      color: #94a3b8;
      margin-top: 20px;
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
    }
    .card-footer a {
      color: var(--color-primary);
      text-decoration: underline;
    }

    .step-badge {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 800;
      color: var(--color-primary);
      background: var(--color-primary-light);
      padding: 2px 10px;
      border-radius: var(--radius-pill);
      margin-bottom: 6px;
    }

    .section-desc {
      font-size: 0.84rem;
      color: #64748b;
      line-height: 1.45;
      margin-bottom: 12px;
    }

    .btn-secondary, .btn-outline {
      padding: 10px 16px;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      border: 1.5px solid transparent;
      transition: all 0.2s;
    }
    .btn-secondary {
      background: #f1f5f9;
      color: #334155;
    }
    .btn-secondary:hover {
      background: #e2e8f0;
    }
    .btn-outline {
      background: transparent;
      border-color: #cbd5e1;
      color: #64748b;
    }
    .btn-outline:hover {
      background: #f8fafc;
      color: #0f172a;
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes progressSweep {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
  `]
})
export class AuthModalComponent {
  authService = inject(AuthService);
  sessionService = inject(SessionService);

  // Login form state
  loginIdentifier = 'explorador';
  loginPassword = 'Vamoo2026!';
  showPassword = signal<boolean>(false);

  // Register form state
  registerEmail = 'nuevo.explorador@vamoo.app';
  registerUsername = 'explorador_nuevo';
  registerBirthDate = '2004-05-18';
  calculatedAge = 22;
  registerPassword = 'Password2026!';
  registerConfirmPassword = 'Password2026!';
  acceptTerms = true;
  isCheckingUsername = signal<boolean>(false);

  // OTP state
  otpCodeInput = '';

  // Google confirm state
  googleNickname = 'cesar_explorador';
  googleAge = 24;

  // Recovery state
  recoveryEmail = 'explorador@vamoo.app';
  recoveryOtpCode = '';
  recoveryNewPassword = '';
  recoveryConfirmPassword = '';

  constructor() {
    this.calculateAgeFromDate();
  }

  closeModal(): void {
    this.sessionService.closeModal();
  }

  openPrivacy(): void {
    this.sessionService.openModal('privacy');
  }

  toggleRememberMe(event: any): void {
    this.authService.rememberMe.set(event.target.checked);
  }

  quickFillCredentials(): void {
    this.loginIdentifier = 'explorador';
    this.loginPassword = 'Vamoo2026!';
  }

  async handleLoginSubmit(): Promise<void> {
    await this.authService.loginWithCredentials(this.loginIdentifier, this.loginPassword);
  }

  async handleGoogleLogin(): Promise<void> {
    await this.authService.loginWithGoogle();
  }

  calculateAgeFromDate(): void {
    if (!this.registerBirthDate) {
      this.calculatedAge = 0;
      return;
    }
    const birth = new Date(this.registerBirthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    this.calculatedAge = age;
  }

  checkUsernamePreview(): void {
    this.isCheckingUsername.set(true);
    setTimeout(() => {
      this.isCheckingUsername.set(false);
    }, 200);
  }

  handleRegisterSubmit(): void {
    this.calculateAgeFromDate();
    this.authService.validateRegistrationStep1({
      email: this.registerEmail,
      username: this.registerUsername,
      birthDate: this.registerBirthDate,
      age: this.calculatedAge,
      password: this.registerPassword,
      confirmPassword: this.registerConfirmPassword,
      acceptTerms: this.acceptTerms
    });
  }

  applySuggestedUsername(suggested: string): void {
    this.registerUsername = suggested;
    this.authService.selectSuggestedUsername(suggested);
  }

  autoFillOtp(code: string): void {
    this.otpCodeInput = code;
  }

  async handleVerifyOtpSubmit(): Promise<void> {
    await this.authService.verifyRegistrationOtp(this.otpCodeInput);
  }

  async handleGoogleRegisterSubmit(): Promise<void> {
    await this.authService.confirmGoogleRegistration(
      'cicaa.explorador@gmail.com',
      this.googleNickname,
      this.googleAge
    );
  }

  async handleRequestRecoverySubmit(): Promise<void> {
    await this.authService.requestPasswordRecovery(this.recoveryEmail);
  }

  async handleResetPasswordSubmit(): Promise<void> {
    await this.authService.verifyOtpAndResetPassword(
      this.recoveryOtpCode,
      this.recoveryNewPassword,
      this.recoveryConfirmPassword
    );
  }
}
