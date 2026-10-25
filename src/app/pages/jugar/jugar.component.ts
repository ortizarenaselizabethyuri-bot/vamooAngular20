import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Interfaz para los modos de juego disponibles.
 */
export interface GameMode {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: 'Fácil' | 'Media' | 'Difícil' | 'Extrema';
  status: 'Disponible' | 'Próximamente';
}

/**
 * Componente de la sección Jugar (JugarComponent).
 *
 * Propósito: Presentar los modos de juego y aventura interactiva del universo Vamoo
 * en un formato compacto y retro pixel art, preparado para futuras expansiones.
 */
@Component({
  selector: 'app-jugar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './jugar.component.html',
  styleUrl: './jugar.component.css',
})
export class JugarComponent {
  /**
   * Modos de juego emblemáticos disponibles en la plataforma.
   */
  readonly gameModes: GameMode[] = [
    {
      id: 'modo-mapa',
      title: 'EXPLORACIÓN DE RUTAS',
      description: 'Camina y descubre puntos de interés geográficos en el mapa interactivo.',
      icon: '🗺️',
      difficulty: 'Fácil',
      status: 'Disponible',
    },
    {
      id: 'modo-misiones',
      title: 'MISIONES DEL GREMIO',
      description: 'Supera acertijos y desafíos urbanos para ganar medallas de honor.',
      icon: '⚔️',
      difficulty: 'Media',
      status: 'Disponible',
    },
    {
      id: 'modo-incursiones',
      title: 'INCURSIONES COOPERATIVAS',
      description: 'Une fuerzas con otros aventureros para derrotar guardianes.',
      icon: '🐉',
      difficulty: 'Extrema',
      status: 'Próximamente',
    },
  ];

  /**
   * Inicializa el componente con el router de Angular.
   *
   * @param router - Servicio de navegación de rutas.
   */
  constructor(private readonly router: Router) {}

  /**
   * Navega hacia el inicio de sesión para aventureros no registrados.
   *
   * @returns void
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
