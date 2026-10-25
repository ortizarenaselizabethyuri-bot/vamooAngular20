import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * Interfaz descriptiva para los botones de navegación con estética poligonal retro.
 */
export interface NavButton {
  /** Identificador único que coincide con el segmento de la ruta */
  id: string;
  /** Texto en fuente pixel que se muestra en el botón */
  label: string;
  /** Tipo de ícono pixel art a renderizar */
  iconType: 'inicio' | 'jugar' | 'comunidad' | 'login' | 'register';
  /** Tema de color (gradiente superior, base y borde) */
  colorTheme: 'inicio' | 'jugar' | 'comunidad' | 'login' | 'register';
  /** Forma geométrica poligonal retro del botón */
  shapeType: 'slant-right' | 'trap-inv' | 'trap-up' | 'trap-inv-2' | 'slant-right-2' | 'slant-right-3';
}

/**
 * Componente de encabezado pixel art RPG (HeaderComponent).
 *
 * Propósito: Renderizar la barra de navegación superior con diseño de cinta poligonal,
 * sincronizada en tiempo real con las rutas de la aplicación (inicio, jugar, comunidad, login, register).
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  /** Servicio de enrutamiento de Angular */
  private readonly router = inject(Router, { optional: true });

  /** Estado reactivo del botón activo en la botonera */
  readonly activeBtn = signal<string>('inicio');

  /** Listado de botones del menú principal */
  readonly navButtons: NavButton[] = [
    {
      id: 'inicio',
      label: 'INICIO',
      iconType: 'inicio',
      colorTheme: 'inicio',
      shapeType: 'slant-right',
    },
    {
      id: 'jugar',
      label: 'JUGAR',
      iconType: 'jugar',
      colorTheme: 'jugar',
      shapeType: 'trap-inv',
    },
    {
      id: 'comunidad',
      label: 'COMUNIDAD',
      iconType: 'comunidad',
      colorTheme: 'comunidad',
      shapeType: 'trap-up',
    },
    {
      id: 'login',
      label: 'LOGIN',
      iconType: 'login',
      colorTheme: 'login',
      shapeType: 'trap-inv-2',
    },
    {
      id: 'register',
      label: 'REGISTER',
      iconType: 'register',
      colorTheme: 'register',
      shapeType: 'slant-right-3',
    },
  ];

  /**
   * Inicializa la suscripción a eventos de navegación para mantener el botón activo sincronizado.
   */
  constructor() {
    if (this.router) {
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event) => {
          this.updateActiveFromUrl(event.urlAfterRedirects || event.url);
        });

      this.updateActiveFromUrl(this.router.url);
    }
  }

  /**
   * Actualiza el botón activo a partir de la URL actual.
   *
   * @param url - Ruta URL actual navegada.
   * @returns void
   */
  private updateActiveFromUrl(url: string): void {
    const cleanSegment = url.replace(/^\//, '').split('?')[0].split('/')[0];
    if (cleanSegment && ['inicio', 'jugar', 'comunidad', 'login', 'register'].includes(cleanSegment)) {
      this.activeBtn.set(cleanSegment);
    } else if (!cleanSegment) {
      this.activeBtn.set('inicio');
    }
  }

  /**
   * Selecciona una opción del menú y ejecuta la navegación a la ruta correspondiente.
   *
   * @param id - Identificador de la ruta a la que se desea navegar.
   * @returns void
   */
  selectNav(id: string): void {
    this.activeBtn.set(id);
    if (this.router) {
      this.router.navigate(['/' + id]);
    }
  }
}
