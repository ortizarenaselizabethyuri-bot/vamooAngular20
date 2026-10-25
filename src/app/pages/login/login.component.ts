import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

/**
 * Componente de inicio de sesión RPG (LoginComponent).
 *
 * Propósito: Permitir a los aventureros autenticarse mediante credenciales locales
 * (usuario/email y contraseña) o a través de Google OAuth 2.0 en una ventana de diálogo retro.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
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
   * Inicializa el componente con el router de navegación.
   *
   * @param router - Servicio de enrutamiento de Angular.
   */
  constructor(private readonly router: Router) {}

  /**
   * Alterna la visibilidad de la contraseña en texto plano o asteriscos.
   *
   * @returns void
   */
  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  /**
   * Procesa el formulario de login tradicional con validaciones del lado del cliente.
   *
   * @returns void
   */
  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const user = this.username().trim();
    const pass = this.password().trim();

    if (!user) {
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

    // Simulación de autenticación RPG
    setTimeout(() => {
      this.isLoading.set(false);
      this.successMessage.set(`¡BIENVENIDO AL GREMIO, ${user.toUpperCase()}!`);
    }, 600);
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

    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    const googleAuthUrl = `${baseUrl}/auth/google`;

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
