import { Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio/inicio.component';
import { JugarComponent } from './pages/jugar/jugar.component';
import { ComunidadComponent } from './pages/comunidad/comunidad.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

/**
 * Configuración de rutas principales de la aplicación Vamoo.
 *
 * Define la navegación basada en las opciones de la botonera del menú:
 * - /inicio: Pantalla inicial y de bienvenida (redirección por defecto al entrar a la app)
 * - /jugar: Modos de juego y mapa de aventura
 * - /comunidad: Taberna social y anuncios de gremios
 * - /login: Inicio de sesión con ventana de diálogo RPG
 * - /register: Creación de cuenta de aventurero
 */
export const routes: Routes = [
  { path: 'inicio', component: InicioComponent },
  { path: 'jugar', component: JugarComponent },
  { path: 'comunidad', component: ComunidadComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' },
];
