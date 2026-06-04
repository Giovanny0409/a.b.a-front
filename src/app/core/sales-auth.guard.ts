import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';

const SALES_AUTHORIZATION_ID = '1234';

export const salesAuthorizationGuard: CanMatchFn = () => {
  const router = inject(Router);
  const authorizationId = window.prompt('Ingresa el ID de autorizacion para ventas');

  if (authorizationId === SALES_AUTHORIZATION_ID) {
    return true;
  }

  window.alert('ID de autorizacion incorrecto.');
  return router.parseUrl('/tablero');
};
