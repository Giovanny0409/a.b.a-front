import { EnvironmentProviders } from '@angular/core';
import { provideStoreDevtools } from '@ngrx/store-devtools';

/** Configuración de `ng serve` y del build `development` (ver `environment.ts`). */
export const environment = {
  production: false,
  /** URL base de la API del backend (`a.b.a-back`). */
  apiBaseUrl: 'http://localhost:5028/api',
  /** Solo en desarrollo: las Redux DevTools. Aquí y no en `app.config.ts`, para que no lleguen al bundle de producción. */
  devProviders: [provideStoreDevtools({ maxAge: 25 })] as EnvironmentProviders[]
};
