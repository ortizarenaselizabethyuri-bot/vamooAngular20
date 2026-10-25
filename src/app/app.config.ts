import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

/**
 * Configuración global de la aplicación Angular de Vamoo.
 *
 * Propósito: Proveer el enrutador principal, cliente HTTP para conexión con el backend NestJS
 * y capturador global de errores del navegador.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
  ],
};
