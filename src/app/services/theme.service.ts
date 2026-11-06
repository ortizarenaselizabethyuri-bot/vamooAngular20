import { Injectable, signal, computed } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

/**
 * Servicio global para la gestión del Modo Oscuro y Modo Claro en Vamoo.
 *
 * Propósito: Sincronizar el tema seleccionado por el aventurero entre todos los
 * componentes, persistirlo en localStorage y aplicar las clases/atributos
 * pertinentes en el elemento raíz HTML y el cuerpo del documento.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly storageKey = 'vamoo_theme_mode';

  /** Señal reactiva con el modo de tema actual */
  readonly currentTheme = signal<ThemeMode>(this.getInitialTheme());

  /** Indicador booleano de si el modo oscuro está activo */
  readonly isDark = computed(() => this.currentTheme() === 'dark');

  constructor() {
    this.applyTheme(this.currentTheme());
  }

  /**
   * Obtiene el tema inicial desde el almacenamiento local o la preferencia del sistema operativo.
   */
  private getInitialTheme(): ThemeMode {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(this.storageKey);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }

    // Por defecto en aplicaciones gamer/Steam, preferimos dark
    return 'dark';
  }

  /**
   * Alterna entre modo oscuro y modo claro.
   */
  toggleTheme(): void {
    const nextTheme: ThemeMode = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  /**
   * Establece un tema específico y lo aplica en el DOM.
   *
   * @param theme - 'dark' | 'light'
   */
  setTheme(theme: ThemeMode): void {
    this.currentTheme.set(theme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, theme);
    }
    this.applyTheme(theme);
  }

  /**
   * Aplica los atributos y clases correspondientes en el DOM.
   */
  private applyTheme(theme: ThemeMode): void {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-theme', theme);
      document.body.classList.remove('theme-dark', 'theme-light');
      document.body.classList.add(`theme-${theme}`);
    }
  }
}

