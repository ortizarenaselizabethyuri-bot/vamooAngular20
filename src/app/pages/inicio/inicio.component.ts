import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Componente principal de la sección Inicio (InicioComponent).
 *
 * Propósito: Presentar la vista inicial y de bienvenida del mundo pixel-art RPG de Vamoo,
 * con acceso directo a jugar, unirse a la comunidad o autenticarse.
 */
@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css',
})
export class InicioComponent {
  /**
   * Inicializa el componente con el servicio de enrutamiento.
   *
   * @param router - Servicio de navegación de Angular.
   */
  constructor(private readonly router: Router) {}

  /**
   * Navega hacia la sección de juego.
   *
   * @returns void
   */
  goToPlay(): void {
    this.router.navigate(['/jugar']);
  }

  /**
   * Navega hacia la sección de comunidad de aventureros.
   *
   * @returns void
   */
  goToCommunity(): void {
    this.router.navigate(['/comunidad']);
  }

  /**
   * Navega hacia el formulario de inicio de sesión.
   *
   * @returns void
   */
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
