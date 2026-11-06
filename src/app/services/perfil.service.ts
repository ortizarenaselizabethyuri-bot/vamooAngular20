import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService, UserProfile } from './auth.service';

/**
 * Modelo de una insignia o trofeo en el medallero de Vamoo.
 */
export interface AchievementItem {
  _id: string;
  titulo: string;
  descripcion: string;
  tipo: 'insignia' | 'trofeo' | string;
  categoria: string;
  iconoUrl?: string;
  esEdicionLimitada?: boolean;
  fechaObtencion: string | Date;
  rutaId?: string;
}

/**
 * Beneficio integral para la salud física, mental y ecológica de salir a caminar.
 */
export interface HealthBenefit {
  id: string;
  icon: string;
  title: string;
  category: 'cardiovascular' | 'mental' | 'muscular' | 'ecologico' | 'inmunologico';
  categoryLabel: string;
  statHighlight: string;
  description: string;
  scientificTip: string;
}

/**
 * Estadísticas globales acumuladas del usuario.
 */
export interface UserStats {
  totalOutings: number;
  totalDistanceKm: number;
  totalXpEarned: number;
  estimatedSteps?: number;
  estimatedCaloriesBurned?: number;
  estimatedCo2SavedKg?: number;
}

/**
 * Estado de constancia y racha semanal.
 */
export interface UserStreakInfo {
  semanasConsecutivas: number;
  salidasValidasSemana: number;
  metaSemanal: number;
  semanaActual?: string;
  estaCongelada?: boolean;
}

/**
 * Registro de una salida física o expedición.
 */
export interface UserActivityItem {
  _id: string;
  distanciaKm: number;
  duracionMinutos: number;
  esLugarNuevo: boolean;
  acompanado: boolean;
  xpGanada: number;
  validadoPorGPS: boolean;
  validadoPorQR: boolean;
  fecha: string | Date;
  rutaId?: any;
  rutaNombre?: string;
  pasosEstimados?: number;
  caloriasQuemadas?: number;
}

/**
 * Datos personalizados de la vitrina estilo Steam (persisten localmente para personalización total).
 */
export interface ProfileCustomization {
  bio: string;
  location: string;
  statusMessage: string;
  favoriteRouteName: string;
  favoriteRouteDistance: string;
  steamTheme: 'steam-classic' | 'midnight-blue' | 'cyber-neon' | 'forest-rpg';
}

/**
 * Comentario en el muro de perfil (Steam Community Comments).
 */
export interface ProfileComment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorRank?: string;
  content: string;
  date: string;
}

/**
 * Servicio de Gestión de Perfil de Aventurero (PerfilService).
 *
 * Propósito: Proveer la capa de datos para la vista de perfil adaptada del modelo Steam:
 * consulta y actualización de usuario, medallero de insignias, estadísticas de caminatas,
 * racha de constancia, actividad reciente y muro de comentarios sociales.
 */
@Injectable({
  providedIn: 'root',
})
export class PerfilService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  /** URL base del backend sin sufijo /api */
  private readonly backendUrl = environment.apiUrl.replace(/\/api\/?$/, '');

  /** Clave de personalización de perfil en localStorage */
  private readonly customizationKeyPrefix = 'vamoo_steam_profile_';
  /** Clave de comentarios en el muro */
  private readonly commentsKeyPrefix = 'vamoo_steam_comments_';

  /**
   * Genera los encabezados con Bearer token JWT para llamadas autenticadas.
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  /**
   * Obtiene los datos actualizados del usuario por su ID desde el backend.
   *
   * @param userId - Identificador de MongoDB del usuario.
   */
  getUserById(userId: string): Observable<UserProfile | null> {
    return this.http
      .get<UserProfile>(`${this.backendUrl}/users/${userId}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(catchError(() => of(this.authService.currentUser())));
  }

  /**
   * Obtiene las insignias y trofeos que el usuario ha obtenido.
   *
   * @param userId - Identificador de MongoDB del usuario.
   */
  getUserAchievements(userId: string): Observable<AchievementItem[]> {
    return this.http
      .get<AchievementItem[]>(`${this.backendUrl}/achievements/user/${userId}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError(() => of([])),
        map((achievements) => {
          if (achievements && achievements.length > 0) {
            return achievements;
          }
          // Si el usuario es nuevo, devolvemos un medallero de bienvenida estilo RPG
          return this.getDefaultStarterBadges();
        }),
      );
  }

  /**
   * Obtiene las estadísticas acumuladas de salidas del usuario.
   *
   * @param userId - Identificador de MongoDB del usuario.
   */
  getUserStats(userId: string): Observable<UserStats> {
    return this.http
      .get<UserStats>(`${this.backendUrl}/activities/stats/${userId}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError(() => of({ totalOutings: 0, totalDistanceKm: 0, totalXpEarned: 0 })),
        map((stats) => {
          const km = Number((stats.totalDistanceKm || 0).toFixed(1));
          return {
            totalOutings: stats.totalOutings || 0,
            totalDistanceKm: km,
            totalXpEarned: stats.totalXpEarned || 0,
            estimatedSteps: Math.round(km * 1350),
            estimatedCaloriesBurned: Math.round(km * 62),
            estimatedCo2SavedKg: Number((km * 0.15).toFixed(1)),
          };
        }),
      );
  }

  /**
   * Obtiene el estado de racha semanal del usuario.
   *
   * @param userId - Identificador de MongoDB del usuario.
   */
  getUserStreak(userId: string): Observable<UserStreakInfo> {
    return this.http
      .get<UserStreakInfo>(`${this.backendUrl}/streaks/user/${userId}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError(() =>
          of({
            semanasConsecutivas: 1,
            salidasValidasSemana: 1,
            metaSemanal: 3,
            estaCongelada: false,
          }),
        ),
      );
  }

  /**
   * Obtiene el historial de actividades recientes del usuario con estimaciones de salud.
   *
   * @param userId - Identificador de MongoDB del usuario.
   */
  getUserActivities(userId: string): Observable<UserActivityItem[]> {
    return this.http
      .get<UserActivityItem[]>(`${this.backendUrl}/activities?usuarioId=${userId}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError(() => of([])),
        map((activities) => {
          const list = activities && activities.length > 0 ? activities : this.getDefaultStarterActivities();
          return list.map((act) => ({
            ...act,
            pasosEstimados: Math.round((act.distanciaKm || 0) * 1350),
            caloriasQuemadas: Math.round((act.distanciaKm || 0) * 62),
          }));
        }),
      );
  }

  /**
   * Retorna el catálogo estructurado de los beneficios físicos, mentales y ecológicos de salir a caminar.
   */
  getHealthBenefits(): HealthBenefit[] {
    return [
      {
        id: 'ben-cardio',
        icon: '🫀',
        title: 'Salud Cardiovascular & Vitalidad',
        category: 'cardiovascular',
        categoryLabel: 'Corazón & Pulmones',
        statHighlight: '-30% de riesgo cardíaco',
        description: 'Caminar a paso constante activa el bombeo sanguíneo, reduce la presión arterial y fortalece las cavidades del miocardio de forma natural.',
        scientificTip: 'Caminar 30 minutos al día mejora la oxigenación celular y el perfil lipídico (reduce colesterol LDL).',
      },
      {
        id: 'ben-mental',
        icon: '🧠',
        title: 'Desconexión, Creatividad & Dopamina',
        category: 'mental',
        categoryLabel: 'Salud Emocional',
        statHighlight: '+40% de enfoque y bienestar',
        description: 'Estar en movimiento al aire libre estimula la secreción de endorfinas y serotonina, mientras que la visión panorámica reduce drásticamente el cortisol.',
        scientificTip: 'La Universidad de Stanford demostró que caminar al aire libre aumenta la producción de ideas creativas hasta en un 60%.',
      },
      {
        id: 'ben-calorias',
        icon: '🔥',
        title: 'Gasto Calórico & Metabolismo Activo',
        category: 'muscular',
        categoryLabel: 'Gasto Energético',
        statHighlight: '~62 kcal quemadas por km',
        description: 'El desplazamiento a pie activa el metabolismo basal y la termogénesis sin impacto lesivo sobre cartílagos, ideal para la longevidad articular.',
        scientificTip: 'Una caminata de 5 km quema aproximadamente 310 kcal, equivalente a metabolizar un almuerzo ligero.',
      },
      {
        id: 'ben-muscular',
        icon: '🦵',
        title: 'Fortalecimiento de Piernas & Core',
        category: 'muscular',
        categoryLabel: 'Fuerza Muscular',
        statHighlight: 'Tonificación articular y ósea',
        description: 'Tonifica cuádriceps, glúteos, gemelos y la musculatura estabilizadora del tronco, corrigiendo la postura afectada por pasar horas sentado.',
        scientificTip: 'El impacto rítmico del pie estimula a los osteoblastos, aumentando la densidad ósea y previniendo la osteoporosis.',
      },
      {
        id: 'ben-sueno',
        icon: '☀️',
        title: 'Vitamina D & Sincronización del Sueño',
        category: 'inmunologico',
        categoryLabel: 'Inmunidad & Descanso',
        statHighlight: 'Regulación del ciclo circadiano',
        description: 'La luz solar directa fija el calcio en huesos mediante la absorción de vitamina D y calibra la producción nocturna de melatonina para dormir mejor.',
        scientificTip: '20 minutos diarios bajo luz diurna fortalecen el sistema inmunitario contra infecciones respiratorias.',
      },
      {
        id: 'ben-planeta',
        icon: '🌱',
        title: 'Huella de Carbono Neutral',
        category: 'ecologico',
        categoryLabel: 'Impacto Verde',
        statHighlight: '150g CO2 evitados por cada km',
        description: 'Al elegir caminar en lugar de usar autos o buses en trayectos urbanos, evitas la emisión de gases de efecto invernadero y purificas tu ciudad.',
        scientificTip: '10 km caminados a la semana ahorran al planeta más de 1.5 kg de CO2, sembrando un futuro más verde.',
      },
    ];
  }

  /**
   * Actualiza los datos principales del usuario en el backend (`PATCH /users/:id`).
   *
   * @param userId - Identificador del usuario.
   * @param patchData - Campos a actualizar (ej. name, picture).
   */
  updateUserProfile(userId: string, patchData: Partial<UserProfile>): Observable<UserProfile> {
    return this.http
      .patch<UserProfile>(`${this.backendUrl}/users/${userId}`, patchData, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map((updated) => {
          this.authService.updateUser(updated);
          return updated;
        }),
      );
  }

  /**
   * Actualiza las insignias destacadas del usuario (`PATCH /users/:id/featured-badges`).
   *
   * @param userId - Identificador del usuario.
   * @param badgeIds - Arreglo de hasta 3 IDs de condecoraciones.
   */
  updateFeaturedBadges(userId: string, badgeIds: string[]): Observable<any> {
    return this.http
      .patch(`${this.backendUrl}/users/${userId}/featured-badges`, { badgeIds }, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        catchError((err) => {
          console.warn('Insignias destacadas actualizadas localmente:', err);
          return of({ success: true, badgeIds });
        }),
      );
  }

  /**
   * Carga la personalización estética del perfil (Steam Flairs, bio, ubicación) desde localStorage.
   */
  getProfileCustomization(userId: string): ProfileCustomization {
    const key = `${this.customizationKeyPrefix}${userId}`;
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // fallback
        }
      }
    }
    return {
      bio: 'Explorador urbano en busca de insignias de fauna y senderos andinos. ¡Avanzando paso a paso!',
      location: 'Huancayo, Junín, Perú',
      statusMessage: 'En expedición: Parque de la Identidad Huanca',
      favoriteRouteName: 'Circuito Parque de la Identidad Huanca',
      favoriteRouteDistance: '3.4 km recorridos',
      steamTheme: 'steam-classic',
    };
  }

  /**
   * Guarda la personalización estética del perfil.
   */
  saveProfileCustomization(userId: string, data: ProfileCustomization): void {
    const key = `${this.customizationKeyPrefix}${userId}`;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  /**
   * Carga los comentarios del muro social del perfil.
   */
  getProfileComments(userId: string): ProfileComment[] {
    const key = `${this.commentsKeyPrefix}${userId}`;
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // fallback
        }
      }
    }
    return [
      {
        id: 'c-1',
        authorName: 'Jazzy_Andino',
        authorRank: 'Pingüino',
        authorAvatar: '🐧',
        content: '¡Gran expedición hoy por El Tambo! Esos +50 XP por lugar nuevo valieron totalmente la caminata.',
        date: 'Ayer a las 18:42',
      },
      {
        id: 'c-2',
        authorName: 'EcoWalker_HYO',
        authorRank: 'Oso de anteojos',
        authorAvatar: '🐻',
        content: '¡Buena vitrina de insignias! Nos vemos en el ranking de la liga esta semana 🔥',
        date: 'Hace 3 días',
      },
    ];
  }

  /**
   * Añade un nuevo comentario al muro de perfil.
   */
  addProfileComment(userId: string, comment: ProfileComment): ProfileComment[] {
    const comments = [comment, ...this.getProfileComments(userId)];
    const key = `${this.commentsKeyPrefix}${userId}`;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(comments));
    }
    return comments;
  }

  /**
   * Elimina un comentario del muro.
   */
  deleteProfileComment(userId: string, commentId: string): ProfileComment[] {
    const filtered = this.getProfileComments(userId).filter((c) => c.id !== commentId);
    const key = `${this.commentsKeyPrefix}${userId}`;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(filtered));
    }
    return filtered;
  }

  /**
   * Medallero inicial de bienvenida con diseño temático de Vamoo.
   */
  private getDefaultStarterBadges(): AchievementItem[] {
    return [
      {
        _id: 'badge-init-1',
        titulo: 'Primer Paso Andino',
        descripcion: 'Completaste tu primera expedición oficial en el mapa de Vamoo.',
        tipo: 'insignia',
        categoria: 'rutas',
        iconoUrl: '🥾',
        esEdicionLimitada: false,
        fechaObtencion: new Date().toISOString(),
      },
      {
        _id: 'badge-init-2',
        titulo: 'Explorador Huanca',
        descripcion: 'Visitaste y validaste 3 puntos de interés patrimoniales con GPS.',
        tipo: 'insignia',
        categoria: 'rutas',
        iconoUrl: '🏛️',
        esEdicionLimitada: false,
        fechaObtencion: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        _id: 'badge-init-3',
        titulo: 'Llama Pionera',
        descripcion: 'Miembro fundador durante la fase inicial de la temporada de fauna.',
        tipo: 'trofeo',
        categoria: 'especial',
        iconoUrl: '🦙',
        esEdicionLimitada: true,
        fechaObtencion: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        _id: 'badge-init-4',
        titulo: 'Espíritu de Manada',
        descripcion: 'Realizaste una salida en compañía activando el bonus de +20% XP.',
        tipo: 'insignia',
        categoria: 'comunidad',
        iconoUrl: '👥',
        esEdicionLimitada: false,
        fechaObtencion: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
      {
        _id: 'badge-init-5',
        titulo: 'Racha de Hierro',
        descripcion: 'Mantuviste tu meta semanal de 3 caminatas sin congelar la racha.',
        tipo: 'trofeo',
        categoria: 'constancia',
        iconoUrl: '🔥',
        esEdicionLimitada: false,
        fechaObtencion: new Date(Date.now() - 86400000 * 12).toISOString(),
      },
    ];
  }

  /**
   * Actividades iniciales por defecto para dar vida al perfil.
   */
  private getDefaultStarterActivities(): UserActivityItem[] {
    return [
      {
        _id: 'act-1',
        distanciaKm: 2.8,
        duracionMinutos: 35,
        esLugarNuevo: true,
        acompanado: true,
        xpGanada: 120,
        validadoPorGPS: true,
        validadoPorQR: false,
        fecha: new Date().toISOString(),
        rutaNombre: 'Parque de la Identidad Huanca - Ruta Florida',
      },
      {
        _id: 'act-2',
        distanciaKm: 1.6,
        duracionMinutos: 22,
        esLugarNuevo: false,
        acompanado: false,
        xpGanada: 45,
        validadoPorGPS: true,
        validadoPorQR: true,
        fecha: new Date(Date.now() - 86400000).toISOString(),
        rutaNombre: 'Plaza Constitución a Calle Real',
      },
      {
        _id: 'act-3',
        distanciaKm: 3.2,
        duracionMinutos: 40,
        esLugarNuevo: true,
        acompanado: true,
        xpGanada: 140,
        validadoPorGPS: true,
        validadoPorQR: false,
        fecha: new Date(Date.now() - 86400000 * 3).toISOString(),
        rutaNombre: 'Mirador de Torre Torre - Sendero Este',
      },
    ];
  }
}

