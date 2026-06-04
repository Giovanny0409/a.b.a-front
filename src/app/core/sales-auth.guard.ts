import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { PosApiService } from './pos-api.service';

export const salesAuthorizationGuard: CanMatchFn = () => {
  const router = inject(Router);
  const api = inject(PosApiService);
  const activeSellerId = sessionStorage.getItem('abaSellerId');

  if (activeSellerId) {
    return true;
  }

  const sellerId = window.prompt('Ingresa el ID de vendedor para ventas');

  if (!sellerId) {
    return router.parseUrl('/tablero');
  }

  return api.authorizeSeller(sellerId).pipe(
    map((authorization) => {
      if (!authorization.authorized || !authorization.seller) {
        window.alert('ID de vendedor no autorizado.');
        return router.parseUrl('/tablero');
      }

      sessionStorage.setItem('abaSellerId', authorization.seller.id);
      sessionStorage.setItem('abaSellerName', authorization.seller.name);
      return true;
    }),
    catchError(() => {
      window.alert('ID de vendedor no autorizado.');
      return of(router.parseUrl('/tablero'));
    })
  );
};
