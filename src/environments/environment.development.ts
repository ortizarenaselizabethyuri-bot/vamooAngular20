/**
 * Configuración del entorno de desarrollo local para Vamoo Frontend.
 *
 * Propósito: Proveer URLs del backend NestJS local y credenciales de Google Maps Platform.
 */
export const environment = {
  /** Indicador de modo producción */
  production: false,
  /** URL base de la API REST del backend NestJS */
  apiUrl: 'http://localhost:3000/api',
  /** Clave de API de Google Maps Platform (Maps JavaScript API y Places API) */
  googleMapsApiKey: 'AIzaSyCRF33WCU3vhX2T72FT8V8HQchek2QX9jQ',
};

