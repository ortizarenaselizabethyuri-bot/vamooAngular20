import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Rangos oficiales de fauna silvestre de Vamoo, alineados a UserRank en el backend.
 */
export type UserRankType =
  | 'Pichón'
  | 'Pingüino'
  | 'Flamenco'
  | 'Oso de anteojos'
  | 'Tortuga marina'
  | 'Bagre dorado';

/**
 * Participante en el grupo de liga semanal competitivo (LeagueGroupSchema y UserSchema).
 */
export interface LeagueParticipant {
  /** Posición en la tabla clasificatoria (1 a 30) */
  posicion: number;
  /** Nombre o alias de aventurero */
  nombre: string;
  /** Avatar emoji pixel art */
  avatar: string;
  /** División o rango de fauna actual */
  rango: UserRankType;
  /** Puntos de experiencia de la liga en el ciclo semanal */
  leagueXp: number;
  /** Semanas consecutivas de constancia en salidas */
  rachaSemanas: number;
  /** Zona competitiva según corte de liga */
  zona: 'Ascenso' | 'Permanencia' | 'Descenso';
  /** Indica si corresponde al aventurero local */
  esUsuarioActual?: boolean;
}

/**
 * Publicación comunitaria para el tablón social de Vamoo.
 */
export interface CommunityPost {
  /** Identificador de la publicación */
  id: string;
  /** Autor del post */
  author: string;
  /** Avatar representativo */
  avatar: string;
  /** Título del anuncio */
  title: string;
  /** Extracto informativo */
  snippet: string;
  /** Categoría temática */
  category: 'Expedición' | 'Local Aliado' | 'Rachas' | 'Ligas';
  /** Contador de reacciones/honores */
  likesCount: number;
}

/**
 * Componente principal de la sección Comunidad (ComunidadComponent).
 *
 * Propósito: Ofrecer el punto de encuentro social de aventureros de Vamoo, combinando
 * las ligas semanales competitivas de fauna (LeagueGroupSchema) y el tablón de
 * expediciones colaborativas en estética pixel art.
 */
@Component({
  selector: 'app-comunidad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comunidad.component.html',
  styleUrl: './comunidad.component.css',
})
export class ComunidadComponent {
  /**
   * Pestaña activa ('liga' o 'tablon').
   */
  activeTab: 'liga' | 'tablon' = 'liga';

  /**
   * Ciclo semanal activo (ej. "2026-W43").
   */
  readonly cicloSemanal: string = '2026-W43';

  /**
   * División activa inspeccionada en el grupo de 30 integrantes.
   */
  readonly divisionActiva: UserRankType = 'Flamenco';

  /**
   * Clasificación de participantes del grupo semanal actual.
   */
  readonly rankingLiga: LeagueParticipant[] = [
    {
      posicion: 1,
      nombre: 'EcoRanger_Inti',
      avatar: '🦩',
      rango: 'Flamenco',
      leagueXp: 520,
      rachaSemanas: 8,
      zona: 'Ascenso',
    },
    {
      posicion: 2,
      nombre: 'ChaskiWalker',
      avatar: '🏃',
      rango: 'Flamenco',
      leagueXp: 460,
      rachaSemanas: 5,
      zona: 'Ascenso',
    },
    {
      posicion: 3,
      nombre: 'KillaExplorer',
      avatar: '🌿',
      rango: 'Flamenco',
      leagueXp: 390,
      rachaSemanas: 12,
      zona: 'Ascenso',
    },
    {
      posicion: 4,
      nombre: 'Tú (Aventurero)',
      avatar: '🐣',
      rango: 'Flamenco',
      leagueXp: 310,
      rachaSemanas: 3,
      zona: 'Permanencia',
      esUsuarioActual: true,
    },
    {
      posicion: 5,
      nombre: 'SumaqViajero',
      avatar: '🎒',
      rango: 'Flamenco',
      leagueXp: 240,
      rachaSemanas: 2,
      zona: 'Permanencia',
    },
    {
      posicion: 6,
      nombre: 'PachaPuma',
      avatar: '🐾',
      rango: 'Flamenco',
      leagueXp: 90,
      rachaSemanas: 0,
      zona: 'Descenso',
    },
  ];

  /**
   * Publicaciones destacadas del tablón de expediciones.
   */
  readonly posts: CommunityPost[] = [
    {
      id: 'post-1',
      author: 'ChaskiWalker',
      avatar: '🏃',
      title: 'Salida grupal en Pantanos de Villa (+20% XP)',
      snippet: 'Nos reunimos este sábado a las 8 AM en el mirador principal. ¡Aprovechemos el bonus cooperativo!',
      category: 'Expedición',
      likesCount: 38,
    },
    {
      id: 'post-2',
      author: 'EcoRanger_Inti',
      avatar: '🦩',
      title: 'Nuevo local aliado: Eco-Café Colibrí',
      snippet: 'Comprobado el QR con 50 XP al ordenar infusiones ecológicas. El código está en la barra de atención.',
      category: 'Local Aliado',
      likesCount: 52,
    },
    {
      id: 'post-3',
      author: 'KillaExplorer',
      avatar: '🌿',
      title: '¡Alcancé el hito de 12 semanas de racha continua!',
      snippet: 'La clave es no olvidar congelar la racha si tienes días de descanso programados. ¡A por las 24 semanas!',
      category: 'Rachas',
      likesCount: 29,
    },
  ];

  /**
   * Mensaje de retroalimentación de racha congelada o interacción.
   */
  streakFreezeNotice: string | null = null;

  /**
   * Inicializa el componente con el router de navegación.
   *
   * @param router - Servicio de navegación de Angular.
   */
  constructor(private readonly router: Router) {}

  /**
   * Cambia la pestaña activa entre la Liga Semanal y el Tablón Social.
   *
   * @param tab - Nombre de la pestaña seleccionada ('liga' | 'tablon').
   * @returns void
   */
  setTab(tab: 'liga' | 'tablon'): void {
    this.activeTab = tab;
  }

  /**
   * Simula la acción de congelar la racha semanal usando uno de los comodines de descanso.
   *
   * @returns void
   */
  freezeStreak(): void {
    this.streakFreezeNotice =
      '🛡️ ¡Racha congelada con éxito! Tu constancia de 3 semanas está protegida para este ciclo.';
  }

  /**
   * Incrementa el contador de honores/likes de una publicación.
   *
   * @param post - Publicación comunitaria a reaccionar.
   * @returns void
   */
  likePost(post: CommunityPost): void {
    post.likesCount++;
  }

  /**
   * Navega hacia el formulario de registro para nuevos aventureros.
   *
   * @returns void
   */
  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
