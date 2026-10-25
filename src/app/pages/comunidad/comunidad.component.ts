import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Interfaz para representar una publicación o anuncio de la comunidad.
 */
export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  title: string;
  snippet: string;
  category: 'Gremio' | 'Guía' | 'Evento' | 'Discusión';
  likesCount: number;
}

/**
 * Componente de la sección Comunidad (ComunidadComponent).
 *
 * Propósito: Proveer el punto de encuentro social, anuncios de gremios y tablón
 * de taberna para la comunidad de jugadores de Vamoo en formato retro pixel art.
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
   * Publicaciones destacadas del tablón de la taberna.
   */
  readonly posts: CommunityPost[] = [
    {
      id: 'post-1',
      author: 'LordPixel',
      avatar: '🧙‍♂️',
      title: '¡Reclutamiento para el Gremio Huancayo!',
      snippet: 'Buscamos aventureros de nivel 5 o más para explorar los senderos del valle.',
      category: 'Gremio',
      likesCount: 24,
    },
    {
      id: 'post-2',
      author: 'RangerMaya',
      avatar: '🏹',
      title: 'Ruta secreta en el Parque Castilla',
      snippet: 'Consejos de orientación y velocidad para maximizar la estamina al caminar.',
      category: 'Guía',
      likesCount: 42,
    },
    {
      id: 'post-3',
      author: 'PaladinLeon',
      avatar: '🛡️',
      title: 'Torneo de Pasos del Fin de Semana',
      snippet: 'Premio especial para los primeros aventureros en completar la vuelta completa.',
      category: 'Evento',
      likesCount: 19,
    },
  ];

  /**
   * Inicializa el componente con el router de navegación.
   *
   * @param router - Servicio de navegación de Angular.
   */
  constructor(private readonly router: Router) {}

  /**
   * Navega hacia el formulario de registro para nuevos aventureros.
   *
   * @returns void
   */
  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
