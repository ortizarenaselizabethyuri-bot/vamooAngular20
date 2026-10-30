import { Injectable, signal, computed, inject } from '@angular/core';
import { 
  AuthMode, 
  AuthMethod, 
  RegistrationStep, 
  RecoveryStep, 
  UserAccount, 
  RegisterFormData 
} from '../models/auth.model';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private sessionService = inject(SessionService);

  // Initial mock database of registered users
  private users: UserAccount[] = [
    {
      id: 'usr_vamoo_01',
      username: 'explorador',
      email: 'explorador@vamoo.app',
      passwordHash: 'Vamoo2026!',
      avatar: 'assets/mascot.jpg',
      age: 22,
      provider: 'email',
      isActive: true,
      rank: 'Pingüino',
      xp: 210,
      tutorialCompleted: false,
      createdAt: '2026-01-15'
    },
    {
      id: 'usr_vamoo_02',
      username: 'alex_runner',
      email: 'alex@ciudad.pe',
      passwordHash: 'Corredor123!',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex',
      age: 26,
      provider: 'email',
      isActive: true,
      rank: 'Liebre',
      xp: 850,
      tutorialCompleted: true,
      createdAt: '2026-02-01'
    },
    {
      id: 'usr_vamoo_03',
      username: 'camila_urban',
      email: 'camila@explora.com',
      passwordHash: 'Camila2026#',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=camila',
      age: 19,
      provider: 'google',
      isActive: true,
      rank: 'Guanaco',
      xp: 1420,
      tutorialCompleted: true,
      createdAt: '2026-02-10'
    }
  ];

  // Auth Modal State Signals
  readonly authMode = signal<AuthMode>('login'); // 'login' | 'register' | 'recovery'
  readonly authMethod = signal<AuthMethod>('email'); // 'email' | 'google'
  readonly registrationStep = signal<RegistrationStep>('email_form');
  readonly recoveryStep = signal<RecoveryStep>('request_email');

  // Control de intentos fallidos (Diagrama 2 & UML «include»)
  readonly failedLoginAttempts = signal<number>(0);
  readonly maxFailedAttempts = 3;
  readonly isLockedOut = signal<boolean>(false);
  readonly lockoutSecondsRemaining = signal<number>(0);
  private lockoutTimer: any = null;

  // Mantener sesión iniciada (UML Caso de Uso)
  readonly rememberMe = signal<boolean>(true);

  // OTP Verification state (Diagrama 2 & UML «include»)
  readonly pendingOtpCode = signal<string>('749201');
  readonly otpCountdown = signal<number>(60);
  private otpTimer: any = null;
  readonly simulatedEmailInbox = signal<{ email: string; subject: string; code: string } | null>(null);

  // Registration transient state
  readonly pendingRegisterData = signal<RegisterFormData>({
    email: '',
    username: '',
    birthDate: '',
    age: 0,
    password: '',
    confirmPassword: '',
    acceptTerms: true
  });
  readonly usernameSuggestions = signal<string[]>([]);

  // Recovery transient state
  readonly pendingRecoveryEmail = signal<string>('');

  // UI status feedback
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly isProcessing = signal<boolean>(false);

  // Computed properties
  readonly attemptsRemaining = computed(() => {
    return Math.max(0, this.maxFailedAttempts - this.failedLoginAttempts());
  });

  constructor() {
    this.restoreSavedSession();
  }

  /**
   * Intenta restaurar sesión previa si el usuario marcó "Mantener sesión"
   */
  private restoreSavedSession(): void {
    try {
      const saved = localStorage.getItem('vamoo_saved_session');
      if (saved) {
        const user = JSON.parse(saved) as UserAccount;
        if (user && user.isActive) {
          this.applyUserSession(user);
        }
      }
    } catch {
      // LocalStorage not available or corrupted, ignore
    }
  }

  /**
   * Cambia la pestaña raíz: "¿Qué desea hacer?"
   */
  setAuthMode(mode: AuthMode): void {
    this.authMode.set(mode);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (mode === 'register') {
      this.registrationStep.set('email_form');
      this.authMethod.set('email');
    } else if (mode === 'recovery') {
      this.recoveryStep.set('request_email');
    } else {
      this.authMethod.set('email');
    }
  }

  /**
   * Alterna método: Correo / Google
   */
  setAuthMethod(method: AuthMethod): void {
    this.authMethod.set(method);
    this.errorMessage.set(null);
    if (this.authMode() === 'register') {
      if (method === 'google') {
        this.registrationStep.set('google_prompt');
      } else {
        this.registrationStep.set('email_form');
      }
    }
  }

  /**
   * INICIAR SESIÓN: Método Contraseña (Correo o Usuario)
   */
  async loginWithCredentials(identifier: string, password: string): Promise<boolean> {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (this.isLockedOut()) {
      this.errorMessage.set(
        `Acceso bloqueado por seguridad. Espera ${this.lockoutSecondsRemaining()} segundos.`
      );
      return false;
    }

    if (!identifier.trim() || !password.trim()) {
      this.errorMessage.set('Por favor ingresa tu usuario o correo y tu contraseña.');
      return false;
    }

    this.isProcessing.set(true);
    await this.delay(400);

    const cleanId = identifier.trim().toLowerCase();
    const user = this.users.find(
      u => (u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId)
    );

    // "¿Acceso válido?"
    if (user && user.passwordHash === password) {
      // ÉXITO: Reiniciar contador de intentos fallidos
      this.failedLoginAttempts.set(0);
      this.isProcessing.set(false);
      this.successMessage.set(`¡Bienvenido de vuelta, ${user.username}!`);
      
      this.applyUserSession(user);

      if (this.rememberMe()) {
        localStorage.setItem('vamoo_saved_session', JSON.stringify(user));
      } else {
        localStorage.removeItem('vamoo_saved_session');
      }

      await this.delay(500);
      this.sessionService.closeModal();
      
      // Comprobar tutorial y solicitar ubicación (Diagrama 2)
      this.sessionService.checkTutorialOrLocation();
      return true;
    }

    // ERROR GENÉRICO Y CONTROL DE INTENTOS FALLIDOS (Diagrama 2 & UML)
    this.isProcessing.set(false);
    const newAttempts = this.failedLoginAttempts() + 1;
    this.failedLoginAttempts.set(newAttempts);

    if (newAttempts >= this.maxFailedAttempts) {
      this.triggerSecurityLockout();
      this.errorMessage.set(
        `Demasiados intentos fallidos. Bloqueo temporal activado por seguridad.`
      );
    } else {
      const remaining = this.maxFailedAttempts - newAttempts;
      this.errorMessage.set(
        `Credenciales incorrectas. Te quedan ${remaining} ${remaining === 1 ? 'intento' : 'intentos'} antes del bloqueo.`
      );
    }

    return false;
  }

  /**
   * INICIAR SESIÓN: Método Google (Validar Identidad Google)
   */
  async loginWithGoogle(mockGoogleEmail: string = 'explorador.google@vamoo.app'): Promise<boolean> {
    this.errorMessage.set(null);
    this.isProcessing.set(true);
    await this.delay(600);

    let user = this.users.find(u => u.email.toLowerCase() === mockGoogleEmail.toLowerCase());
    if (!user) {
      // Si la cuenta Google no existe aún, se crea con datos verificados de Google
      user = {
        id: `usr_g_${Date.now()}`,
        username: mockGoogleEmail.split('@')[0],
        email: mockGoogleEmail,
        avatar: 'https://lh3.googleusercontent.com/a/default-user',
        age: 24,
        provider: 'google',
        isActive: true,
        rank: 'Pingüino',
        xp: 210,
        tutorialCompleted: false,
        createdAt: new Date().toISOString()
      };
      this.users.push(user);
    }

    this.failedLoginAttempts.set(0);
    this.isProcessing.set(false);
    this.successMessage.set(`Identidad de Google verificada con éxito.`);

    this.applyUserSession(user);
    if (this.rememberMe()) {
      localStorage.setItem('vamoo_saved_session', JSON.stringify(user));
    }

    await this.delay(400);
    this.sessionService.closeModal();
    this.sessionService.checkTutorialOrLocation();
    return true;
  }

  /**
   * REGISTRO: Paso 1 - Validar Edad y Datos (Diagrama 2)
   */
  validateRegistrationStep1(formData: RegisterFormData): { isValid: boolean; error?: string } {
    this.errorMessage.set(null);

    if (!formData.email || !formData.email.includes('@')) {
      return { isValid: false, error: 'Ingresa un correo electrónico válido.' };
    }
    if (!formData.username || formData.username.trim().length < 3) {
      return { isValid: false, error: 'El nombre de usuario debe tener al menos 3 caracteres.' };
    }
    if (formData.password && formData.password.length < 6) {
      return { isValid: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }
    if (formData.password !== formData.confirmPassword) {
      return { isValid: false, error: 'Las contraseñas no coinciden.' };
    }

    // "¿Edad admitida?" - Regla Vamoo: Mínimo 14 años
    if (formData.age < 14) {
      // DENEGAR REGISTRO -> Fin sin registro (Diagrama 2)
      this.registrationStep.set('age_denied');
      return { isValid: false, error: 'Edad no admitida para registro autónomo.' };
    }

    // "¿Disponible?" - Verificar nombre único (Diagrama 2)
    const usernameTaken = this.isUsernameTaken(formData.username);
    if (usernameTaken) {
      this.generateUsernameSuggestions(formData.username);
      this.registrationStep.set('username_taken');
      return { isValid: false, error: 'El nombre de usuario ya está en uso.' };
    }

    // Datos válidos -> Proceder según método
    this.pendingRegisterData.set(formData);

    if (this.authMethod() === 'email') {
      // "¿Registro por correo?" -> Sí -> Enviar y verificar código (OTP)
      this.sendRegistrationOtp(formData.email);
      this.registrationStep.set('otp_verification');
    } else {
      // "¿Registro por correo?" -> No -> Confirmar cuenta Google
      this.registrationStep.set('google_prompt');
    }

    return { isValid: true };
  }

  /**
   * Verifica disponibilidad de nombre de usuario único
   */
  isUsernameTaken(username: string): boolean {
    const clean = username.trim().toLowerCase();
    const reserved = ['admin', 'vamoo', 'soporte', 'root'];
    return reserved.includes(clean) || this.users.some(u => u.username.toLowerCase() === clean);
  }

  /**
   * Sugerencias creativas cuando un nickname está ocupado
   */
  generateUsernameSuggestions(base: string): void {
    const clean = base.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const rand1 = Math.floor(10 + Math.random() * 89);
    const rand2 = Math.floor(100 + Math.random() * 899);
    this.usernameSuggestions.set([
      `${clean}_${rand1}`,
      `explora_${clean}`,
      `${clean}_${rand2}`
    ]);
  }

  /**
   * Seleccionar una de las sugerencias de nombre único
   */
  selectSuggestedUsername(suggested: string): void {
    const current = this.pendingRegisterData();
    this.pendingRegisterData.set({
      ...current,
      username: suggested
    });
    this.registrationStep.set('email_form');
  }

  /**
   * Generar y enviar código OTP al correo (Simulación realista)
   */
  sendRegistrationOtp(email: string): void {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.pendingOtpCode.set(newCode);
    this.simulatedEmailInbox.set({
      email,
      subject: '🔑 Tu código de activación Vamoo',
      code: newCode
    });

    this.startOtpTimer();
  }

  /**
   * Reenviar código OTP
   */
  resendRegistrationOtp(): void {
    if (this.otpCountdown() > 0) return;
    const email = this.pendingRegisterData().email || 'explorador@vamoo.app';
    this.sendRegistrationOtp(email);
    this.successMessage.set('Nuevo código enviado a tu correo.');
  }

  /**
   * Temporizador de 60 segundos para reenvío de OTP
   */
  private startOtpTimer(): void {
    if (this.otpTimer) clearInterval(this.otpTimer);
    this.otpCountdown.set(60);
    this.otpTimer = setInterval(() => {
      const current = this.otpCountdown();
      if (current <= 1) {
        clearInterval(this.otpTimer);
        this.otpCountdown.set(0);
      } else {
        this.otpCountdown.set(current - 1);
      }
    }, 1000);
  }

  /**
   * "¿Código válido?" -> Activar cuenta -> Crear sesión (Diagrama 2)
   */
  async verifyRegistrationOtp(enteredCode: string): Promise<boolean> {
    this.errorMessage.set(null);
    this.isProcessing.set(true);
    await this.delay(500);

    if (enteredCode.trim() !== this.pendingOtpCode()) {
      this.isProcessing.set(false);
      this.errorMessage.set('Código de verificación inválido. Revisa tu correo o reenvíalo.');
      return false;
    }

    // Código válido -> Activar cuenta y registrar usuario
    const data = this.pendingRegisterData();
    const newUser: UserAccount = {
      id: `usr_${Date.now()}`,
      username: data.username,
      email: data.email,
      passwordHash: data.password || 'Vamoo2026!',
      avatar: 'assets/mascot.jpg',
      age: data.age,
      provider: 'email',
      isActive: true,
      rank: 'Pingüino',
      xp: 210,
      tutorialCompleted: false,
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.isProcessing.set(false);
    this.registrationStep.set('account_activated');
    this.successMessage.set('¡Cuenta activada con éxito!');

    // Crear sesión (Diagrama 2)
    this.applyUserSession(newUser);
    if (this.rememberMe()) {
      localStorage.setItem('vamoo_saved_session', JSON.stringify(newUser));
    }

    await this.delay(1200);
    this.sessionService.closeModal();
    // Comprobar tutorial -> Solicitar ubicación en módulo 01 -> Continuar al mapa
    this.sessionService.checkTutorialOrLocation();
    return true;
  }

  /**
   * REGISTRO CON GOOGLE: Confirmar cuenta Google -> Activar cuenta -> Crear sesión
   */
  async confirmGoogleRegistration(googleEmail: string, chosenUsername: string, age: number): Promise<boolean> {
    this.errorMessage.set(null);
    if (age < 14) {
      this.registrationStep.set('age_denied');
      return false;
    }

    this.isProcessing.set(true);
    await this.delay(500);

    const newUser: UserAccount = {
      id: `usr_g_${Date.now()}`,
      username: chosenUsername,
      email: googleEmail,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + chosenUsername,
      age: age,
      provider: 'google',
      isActive: true,
      rank: 'Pingüino',
      xp: 210,
      tutorialCompleted: false,
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.isProcessing.set(false);
    this.registrationStep.set('account_activated');

    this.applyUserSession(newUser);
    if (this.rememberMe()) {
      localStorage.setItem('vamoo_saved_session', JSON.stringify(newUser));
    }

    await this.delay(1000);
    this.sessionService.closeModal();
    this.sessionService.checkTutorialOrLocation();
    return true;
  }

  /**
   * RECUPERAR CONTRASEÑA: Paso 1 - Solicitud por Correo (Diagrama 2)
   */
  async requestPasswordRecovery(email: string): Promise<boolean> {
    this.errorMessage.set(null);
    if (!email || !email.includes('@')) {
      this.errorMessage.set('Ingresa un correo electrónico registrado.');
      return false;
    }

    this.isProcessing.set(true);
    await this.delay(400);

    const user = this.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      // Por seguridad e higiene de datos, se muestra mensaje amigable o aviso
      this.errorMessage.set('No se encontró una cuenta vinculada a este correo.');
      this.isProcessing.set(false);
      return false;
    }

    this.pendingRecoveryEmail.set(email.trim());
    this.sendRegistrationOtp(email.trim());
    this.isProcessing.set(false);
    this.recoveryStep.set('otp_and_new_password');
    return true;
  }

  /**
   * RECUPERAR CONTRASEÑA: Paso 2 - Verificar código y actualizar contraseña (Diagrama 2)
   */
  async verifyOtpAndResetPassword(code: string, newPassword: string, confirmNewPassword: string): Promise<boolean> {
    this.errorMessage.set(null);

    if (code.trim() !== this.pendingOtpCode()) {
      this.errorMessage.set('El código de recuperación es incorrecto.');
      return false;
    }

    if (!newPassword || newPassword.length < 6) {
      this.errorMessage.set('La nueva contraseña debe tener al menos 6 caracteres.');
      return false;
    }

    if (newPassword !== confirmNewPassword) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return false;
    }

    this.isProcessing.set(true);
    await this.delay(400);

    const email = this.pendingRecoveryEmail();
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      user.passwordHash = newPassword;
    }

    this.isProcessing.set(false);
    this.recoveryStep.set('recovery_success');
    this.successMessage.set('¡Tu contraseña ha sido actualizada con éxito!');
    return true;
  }

  /**
   * Volver a la pantalla de autenticación tras recuperar contraseña (Diagrama 2: "Inicio")
   */
  backToLogin(): void {
    this.setAuthMode('login');
    this.errorMessage.set(null);
    this.successMessage.set('Ya puedes ingresar con tu nueva contraseña.');
  }

  /**
   * CERRAR SESIÓN (Diagrama UML Caso de Uso: "Cerrar sesión")
   */
  logout(): void {
    localStorage.removeItem('vamoo_saved_session');
    this.sessionService.setAsVisitor();
    this.successMessage.set('Has cerrado sesión correctamente.');
  }

  /**
   * Activa el bloqueo de seguridad por intentos fallidos
   */
  private triggerSecurityLockout(): void {
    this.isLockedOut.set(true);
    this.lockoutSecondsRemaining.set(30);

    if (this.lockoutTimer) clearInterval(this.lockoutTimer);
    this.lockoutTimer = setInterval(() => {
      const remaining = this.lockoutSecondsRemaining();
      if (remaining <= 1) {
        clearInterval(this.lockoutTimer);
        this.isLockedOut.set(false);
        this.lockoutSecondsRemaining.set(0);
        this.failedLoginAttempts.set(0);
        this.errorMessage.set(null);
      } else {
        this.lockoutSecondsRemaining.set(remaining - 1);
      }
    }, 1000);
  }

  /**
   * Desbloqueo forzado rápido (útil para pruebas y desarrollo)
   */
  resetLockout(): void {
    if (this.lockoutTimer) clearInterval(this.lockoutTimer);
    this.isLockedOut.set(false);
    this.lockoutSecondsRemaining.set(0);
    this.failedLoginAttempts.set(0);
    this.errorMessage.set(null);
  }

  /**
   * Sincroniza datos del usuario autenticado en SessionService
   */
  private applyUserSession(user: UserAccount): void {
    this.sessionService.session.update(s => ({
      ...s,
      isAuthenticated: true,
      userId: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      rank: user.rank,
      xp: user.xp,
      tutorialCompleted: user.tutorialCompleted,
      isSessionExpired: false
    }));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
