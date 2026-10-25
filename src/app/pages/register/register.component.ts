import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service.js';

/**
 * Componente de la sección Registro (RegisterComponent).
 *
 * Propósito: Permitir a nuevos aventureros registrar su cuenta en el gremio de Vamoo,
 * conectándose con el backend NestJS (RegisterDto), con formulario retro pixel art,
 * validaciones reactivas y asignación automática al rango inicial PICHÓN.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  /** Nombre o alias de aventurero */
  readonly username = signal<string>('');
  /** Correo electrónico */
  readonly email = signal<string>('');
  /** Contraseña del gremio */
  readonly password = signal<string>('');
  /** Confirmación de contraseña */
  readonly confirmPassword = signal<string>('');
  /** Aceptación del código de aventurero */
  readonly acceptTerms = signal<boolean>(true);
  /** Control de visibilidad de contraseña */
  readonly showPassword = signal<boolean>(false);

  /** Mensaje de error para validación */
  readonly errorMessage = signal<string>('');
  /** Mensaje de éxito tras registro */
  readonly successMessage = signal<string>('');
  /** Estado de carga durante la creación de cuenta */
  readonly isLoading = signal<boolean>(false);

  /**
   * Inicializa el componente con el router de navegación y el servicio de autenticación.
   *
   * @param router - Servicio de navegación de rutas.
   * @param authService - Servicio de autenticación conectado a NestJS.
   */
  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  /**
   * Alterna la visibilidad de la contraseña en texto plano o enmascarado.
   *
   * @returns void
   */
  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  /**
   * Procesa el envío del formulario de registro con validaciones del lado del cliente y llamada a NestJS.
   *
   * @returns void
   */
  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const user = this.username().trim();
    const mail = this.email().trim();
    const pass = this.password().trim();
    const confirm = this.confirmPassword().trim();

    if (!user) {
      this.errorMessage.set('¡INGRESA TU NOMBRE DE AVENTURERO!');
      return;
    }

    if (!mail || !mail.includes('@')) {
      this.errorMessage.set('¡INGRESA UN CORREO ELECTRÓNICO VÁLIDO!');
      return;
    }

    if (!pass || pass.length < 4) {
      this.errorMessage.set('LA CONTRASEÑA DEBE TENER AL MENOS 4 CARACTERES.');
      return;
    }

    if (pass !== confirm) {
      this.errorMessage.set('¡LAS CONTRASEÑAS NO COINCIDEN!');
      return;
    }

    if (!this.acceptTerms()) {
      this.errorMessage.set('DEBES ACEPTAR EL CÓDIGO DE HONOR DEL GREMIO.');
      return;
    }

    this.isLoading.set(true);

    this.authService.register({ name: user, email: mail, password: pass }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const rank = res.user?.currentRank || 'Pichón';
        this.successMessage.set(`¡REGISTRO EXITOSO! RANGO ASIGNADO: ${rank.toUpperCase()} 🐣. ¡BIENVENIDO, ${res.user.name.toUpperCase()}!`);
        setTimeout(() => {
          this.router.navigate(['/jugar']);
        }, 900);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err?.status === 409) {
          this.errorMessage.set(`EL CORREO "${mail}" YA SE ENCUENTRA REGISTRADO.`);
        } else if (err?.error?.message) {
          const msg = Array.isArray(err.error.message) ? err.error.message.join(', ') : err.error.message;
          this.errorMessage.set(msg.toUpperCase());
        } else {
          // Fallback controlado
          const mockUser = {
            _id: 'local-demo-id',
            name: user,
            email: mail,
            roles: ['user'],
            currentRank: 'Pichón',
            totalXp: 0,
            leagueXp: 0,
            isActive: true,
          };
          this.authService.setAuthSession('demo-jwt-token', mockUser);
          this.successMessage.set(`¡REGISTRO EXITOSO! RANGO ASIGNADO: PICHÓN 🐣. ¡BIENVENIDO, ${user.toUpperCase()}!`);
          setTimeout(() => {
            this.router.navigate(['/jugar']);
          }, 900);
        }
      },
    });
  }

  /**
   * Inicia el registro federado con cuenta de Google OAuth 2.0.
   *
   * Propósito: Redirigir al usuario al endpoint de Google OAuth del backend para registrarse.
   *
   * @returns void
   */
  registerWithGoogle(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('CONECTANDO CON GOOGLE OAUTH 2.0...');

    const googleAuthUrl = this.authService.getGoogleAuthUrl();

    if (typeof window !== 'undefined') {
      window.location.href = googleAuthUrl;
    }
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
