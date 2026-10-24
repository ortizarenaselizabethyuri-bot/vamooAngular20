# VamooAngular20

Proyecto Angular configurado con soporte para GitHub Actions, variables de entorno y mejores prácticas.

## Requisitos previos

- **Node.js**: v24 o superior (instalado v24.19.0)
- **npm**: v11 o superior (instalado v11.17.0)
- **Angular CLI**: v22+ (`@angular/cli` instalado global y localmente)

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` o `ng serve` | Inicia el servidor de desarrollo en `http://localhost:4200/` |
| `npm run build` o `ng build` | Compila la aplicación para producción en la carpeta `dist/` |
| `npm test` o `ng test` | Ejecuta las pruebas unitarias con Vitest |
| `npm run watch` | Compila en modo desarrollo con recarga en cambios |

## Entornos (Environments)

El proyecto cuenta con configuración de entornos en `src/environments/`:

- `src/environments/environment.ts`: Configuración para producción (`ng build`).
- `src/environments/environment.development.ts`: Configuración para entorno local / desarrollo (`ng serve`).

## Flujo de trabajo con GitHub

- `.github/workflows/ci.yml`: Integración continua (CI) automática en cada `push` o `pull_request` a `main`.
- `.github/pull_request_template.md`: Plantilla para Pull Requests.
- `.gitignore`: Configurado para ignorar `node_modules/`, `dist/`, `.angular/`, archivos `.env` y temporales del sistema.
- `.gitattributes`: Normalización automática de saltos de línea (LF/CRLF).

## Estructura del proyecto

```text
├── .github/              # Workflows de CI y plantillas de GitHub
├── public/               # Archivos estáticos y favicon
├── src/
│   ├── app/              # Componentes, rutas y lógica de la aplicación
│   ├── environments/     # Configuración por entornos (dev / prod)
│   ├── index.html        # Página raíz HTML
│   ├── main.ts           # Punto de entrada de la aplicación
│   └── styles.css        # Estilos globales
├── angular.json          # Configuración del workspace de Angular
├── package.json          # Dependencias y scripts del proyecto
└── tsconfig.json         # Configuración de TypeScript
```

