import { EnvironmentProviders } from '@angular/core';

/**
 * Configuración del build. `angular.json` reemplaza este archivo por `environment.development.ts` en la
 * configuración `development` (la de `ng serve`). Nunca lleva secretos: termina en el bundle.
 */
export const environment = {
  production: true,
  /** URL base de la API del backend (`a.b.a-back`). */
  apiBaseUrl: 'http://localhost:5028/api',
  /** Providers que solo existen en desarrollo (las Redux DevTools, en `environment.development.ts`). */
  devProviders: [] as EnvironmentProviders[]
};
