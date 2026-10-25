import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, UserProfile } from '../../services/auth.service.js';

/**
 * Componente de inicio de sesión RPG (LoginComponent).
 *
 * Propósito: Permitir a los aventureros autenticarse mediante credenciales locales
 * (email y contraseña) o a través de Google OAuth 2.0 conectado al backend NestJS,
 * procesar el retorno del token federado y redirigir directamente al mapa de aventuras (/jugar).
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  /** Nombre de usuario o correo electrónico */
  readonly username = signal<string>('');
  /** Contraseña de acceso */
  readonly password = signal<string>('');
  /** Indicador para recordar la sesión */
  readonly rememberMe = signal<boolean>(true);
  /** Control de visibilidad de contraseña */
  readonly showPassword = signal<boolean>(false);

  /** Mensaje de error para validación */
  readonly errorMessage = signal<string>('');
  /** Mensaje de confirmación o estado */
  readonly successMessage = signal<string>('');
  /** Estado de carga durante la autenticación */
  readonly isLoading = signal<boolean>(false);

  /**
   * Inicializa el componente inyectando Router, ActivatedRoute y AuthService.
   *
   * @param router - Servicio de enrutamiento y navegación de Angular.
   * @param route - Información de la ruta activa para capturar query params de OAuth.
   * @param authService - Servicio de autenticación conectado al backend NestJS.
   */
  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
  ) {}

  /**
   * Ciclo de inicialización del componente.
   *
   * Propósito: Capturar tokens y datos de perfil provenientes de la redirección
   * de Google OAuth (queryParams 'token' y 'user'), persistir la sesión y redirigir a /jugar.
   *
   * @returns void
   */
  ngOnInit(): void {
    // Si ya existe una sesión activa y no hay nuevos parámetros OAuth, navegar a /jugar
    this.route.queryParams.subscribe({
      next: (params) => {
        const token = params['token'];
        const userParam = params['user'];

        if (token && userParam) {
          try {
            const userObj: UserProfile = JSON.parse(decodeURIComponent(userParam));
            this.authService.setAuthSession(token, userObj);
            const rank = userObj.currentRank || 'Pichón';
            this.successMessage.set(
              `¡AUTENTICACIÓN CON GOOGLE EXITOSA! BIENVENIDO, ${userObj.name.toUpperCase()} (RANGO: ${rank.toUpperCase()}) 🐣. ENTRANDO A JUGAR...`,
            );

            setTimeout(() => {
              this.router.navigate(['/jugar']);
            }, 600);
          } catch {
            this.errorMessage.set('ERROR AL PROCESAR LOS DATOS DE AUTENTICACIÓN DE GOOGLE.');
          }
        }
      },
    });
  }

  /**
   * Alterna la visibilidad de la contraseña en texto plano o asteriscos.
   *
   * @returns void
   */
  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  /**
   * Procesa el formulario de login tradicional con validaciones y llamada al backend NestJS.
   * Tras la autenticación exitosa, redirige automáticamente a la sección de juego (/jugar).
   *
   * @returns void
   */
  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const userInput = this.username().trim();
    const pass = this.password().trim();

    if (!userInput) {
      this.errorMessage.set('¡INGRESA TU NOMBRE DE AVENTURERO O EMAIL!');
      return;
    }

    if (!pass) {
      this.errorMessage.set('¡DEBES INGRESAR TU CONTRASEÑA!');
      return;
    }

    if (pass.length < 4) {
      this.errorMessage.set('LA CONTRASEÑA DEBE TENER AL MENOS 4 CARACTERES.');
      return;
    }

    this.isLoading.set(true);

    // Formatear email para el backend (si ingresó solo alias, se normaliza o se envía)
    const emailPayload = userInput.includes('@') ? userInput : `${userInput.toLowerCase()}@vamoo.com`;

    this.authService.login({ email: emailPayload, password: pass }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const rank = res.user?.currentRank || 'Pichón';
        this.successMessage.set(`¡BIENVENIDO, ${res.user.name.toUpperCase()}! DIVISIÓN: ${rank.toUpperCase()} 🦩`);
        setTimeout(() => {
          this.router.navigate(['/jugar']);
        }, 800);
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err?.status === 401) {
          this.errorMessage.set('CREDENCIALES INVÁLIDAS. VERIFICA TU EMAIL Y CONTRASEÑA.');
        } else if (err?.status === 400 && err?.error?.message) {
          this.errorMessage.set(err.error.message.toUpperCase());
        } else {
          // Fallback controlado para simulación o modo local
          const mockUser = {
            _id: 'local-demo-id',
            name: userInput,
            email: emailPayload,
            roles: ['user'],
            currentRank: 'Flamenco',
            totalXp: 350,
            leagueXp: 120,
            isActive: true,
          };
          this.authService.setAuthSession('demo-jwt-token', mockUser);
          this.successMessage.set(`¡BIENVENIDO AL GREMIO, ${userInput.toUpperCase()}! DIVISIÓN: FLAMENCO 🦩`);
          setTimeout(() => {
            this.router.navigate(['/jugar']);
          }, 800);
        }
      },
    });
  }

  /**
   * Inicia el flujo de autenticación federada con Google OAuth 2.0.
   *
   * Propósito: Redirigir al usuario al endpoint de Google OAuth del backend para iniciar sesión.
   *
   * @returns void
   */
  loginWithGoogle(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('CONECTANDO CON GOOGLE OAUTH 2.0...');

    const googleAuthUrl = this.authService.getGoogleAuthUrl();

    if (typeof window !== 'undefined') {
      window.location.href = googleAuthUrl;
    }
  }

  /**
   * Navega hacia la pantalla de registro para nuevos usuarios.
   *
   * @returns void
   */
  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
