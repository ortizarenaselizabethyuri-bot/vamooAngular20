import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Modelo de datos del usuario autenticado de Vamoo,
 * alineado al UserSchema del backend NestJS.
 */
export interface UserProfile {
  /** Identificador único en MongoDB */
  _id: string;
  /** Nombre completo o alias de aventurero */
  name: string;
  /** Correo electrónico único */
  email: string;
  /** Roles asignados (ej. 'user', 'admin') */
  roles: string[];
  /** Rango o división de fauna silvestre (Pichón, Pingüino, etc.) */
  currentRank: string;
  /** Experiencia histórica acumulada */
  totalXp: number;
  /** Experiencia de la liga en el ciclo semanal */
  leagueXp: number;
  /** URL del avatar o foto de perfil */
  picture?: string;
  /** Estado de actividad de la cuenta */
  isActive: boolean;
  /** Indicador de pausa competitiva */
  isPaused?: boolean;
}

/**
 * Respuesta del endpoint de autenticación (/auth/login y /auth/register).
 */
export interface AuthResponse {
  /** Perfil público del usuario retornado */
  user: UserProfile;
  /** Token JWT de acceso emitido por el backend */
  accessToken: string;
}

/**
 * Credenciales requeridas para inicio de sesión local (LoginDto).
 */
export interface LoginCredentials {
  /** Correo electrónico registrado */
  email: string;
  /** Contraseña de acceso */
  password: string;
}

/**
 * Datos requeridos para registrar un nuevo usuario (RegisterDto).
 */
export interface RegisterData {
  /** Nombre o alias de aventurero */
  name: string;
  /** Correo electrónico */
  email: string;
  /** Contraseña en texto plano a encriptar en el servidor */
  password: string;
}

/**
 * Servicio de Autenticación de Vamoo (AuthService).
 *
 * Propósito: Gestionar la comunicación HTTP con los endpoints de autenticación (/auth) del
 * backend NestJS, administrar el almacenamiento del token JWT y el estado reactivo del usuario en sesión.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /** Clave de almacenamiento en localStorage para el token JWT */
  private readonly tokenKey = 'vamoo_access_token';
  /** Clave de almacenamiento en localStorage para los datos del usuario */
  private readonly userKey = 'vamoo_user_profile';

  /** URL base del backend sin sufijo /api para endpoints de auth */
  private readonly authBaseUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  /** Señal reactiva con el perfil del usuario autenticado */
  readonly currentUser = signal<UserProfile | null>(this.getStoredUser());
  /** Señal reactiva que indica si hay una sesión activa */
  readonly isAuthenticated = signal<boolean>(!!this.getToken());
  /** Señal de estado de carga en peticiones de autenticación */
  readonly isLoading = signal<boolean>(false);

  /**
   * Inicializa el servicio inyectando el cliente HTTP de Angular.
   *
   * @param http - Cliente HTTP de Angular para llamadas REST.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Envía las credenciales al endpoint POST /auth/login para autenticar al usuario.
   *
   * @param credentials - Email y contraseña del usuario.
   * @returns Observable con la respuesta de autenticación (usuario y token).
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http
      .post<AuthResponse>(`${this.authBaseUrl}/auth/login`, credentials)
      .pipe(
        tap((res) => {
          this.setSession(res);
          this.isLoading.set(false);
        }),
        catchError((err) => {
          this.isLoading.set(false);
          return throwError(() => err);
        }),
      );
  }

  /**
   * Registra un nuevo usuario en el backend mediante POST /auth/register.
   *
   * @param data - Nombre, correo electrónico y contraseña del nuevo aventurero.
   * @returns Observable con la respuesta de registro (usuario y token).
   */
  register(data: RegisterData): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http
      .post<AuthResponse>(`${this.authBaseUrl}/auth/register`, data)
      .pipe(
        tap((res) => {
          this.setSession(res);
          this.isLoading.set(false);
        }),
        catchError((err) => {
          this.isLoading.set(false);
          return throwError(() => err);
        }),
      );
  }

  /**
   * Retorna la URL directa para iniciar la federación de identidad con Google OAuth 2.0.
   *
   * @returns string URL absoluta hacia GET /auth/google del backend.
   */
  getGoogleAuthUrl(): string {
    return `${this.authBaseUrl}/auth/google`;
  }

  /**
   * Cierra la sesión activa eliminando las credenciales almacenadas.
   *
   * @returns void
   */
  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  /**
   * Obtiene el token JWT almacenado en el almacenamiento local.
   *
   * @returns string | null Token JWT o null si no existe sesión.
   */
  getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  /**
   * Almacena las credenciales de sesión en localStorage y actualiza las señales reactivas.
   *
   * @param auth - Objeto con usuario y token JWT.
   * @returns void
   */
  setSession(auth: AuthResponse): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.tokenKey, auth.accessToken);
      localStorage.setItem(this.userKey, JSON.stringify(auth.user));
    }
    this.currentUser.set(auth.user);
    this.isAuthenticated.set(true);
  }

  /**
   * Inicializa la sesión del usuario directamente a partir de un token y objeto de perfil
   * (usado en callbacks de Google OAuth o redirecciones).
   *
   * @param accessToken - Token JWT emitido.
   * @param user - Objeto del perfil del usuario.
   * @returns void
   */
  setAuthSession(accessToken: string, user: UserProfile): void {
    this.setSession({ accessToken, user });
  }

  /**
   * Recupera el usuario almacenado en localStorage al iniciar la aplicación.
   *
   * @returns UserProfile | null Perfil recuperado o null.
   */
  private getStoredUser(): UserProfile | null {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(this.userKey);
      if (stored) {
        try {
          return JSON.parse(stored) as UserProfile;
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}
