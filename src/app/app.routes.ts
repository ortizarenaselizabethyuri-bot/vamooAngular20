import { Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio/inicio.component.js';
import { ComunidadComponent } from './pages/comunidad/comunidad.component.js';
import { LoginComponent } from './pages/login/login.component.js';
import { RegisterComponent } from './pages/register/register.component.js';

/**
 * Configuración de rutas principales de la aplicación Vamoo.
 *
 * Define la navegación basada en las opciones de la botonera del menú:
 * - /inicio: Pantalla inicial y de bienvenida (redirección por defecto al entrar a la app)
 * - /jugar: Modos de juego y mapa de aventura (Carga diferida / Lazy-loaded para máximo rendimiento WebGL)
 * - /comunidad: Taberna social y anuncios de gremios
 * - /login: Inicio de sesión con ventana de diálogo RPG
 * - /register: Creación de cuenta de aventurero
 */
export const routes: Routes = [
  { path: 'inicio', component: InicioComponent },
  {
    path: 'jugar',
    loadComponent: () =>
      import('./pages/jugar/jugar.component.js').then((m) => m.JugarComponent),
  },
  { path: 'comunidad', component: ComunidadComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' },
];
