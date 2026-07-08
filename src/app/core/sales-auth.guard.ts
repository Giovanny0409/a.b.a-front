import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, switchMap, take } from 'rxjs';
import { SalesActions } from '../features/sales/store/sales.actions';
import { selectActiveSeller } from '../features/sales/store/sales.selectors';

export const salesAuthorizationGuard: CanMatchFn = () => {
  const router = inject(Router);
  const store = inject(Store);
  const actions$ = inject(Actions);

  return store.select(selectActiveSeller).pipe(
    take(1),
    switchMap((activeSeller) => {
      if (activeSeller) {
        return [true];
      }

      const sellerId = window.prompt('Ingresa el ID de vendedor para ventas');

      if (!sellerId) {
        return [router.parseUrl('/tablero')];
      }

      const requestId = crypto.randomUUID();
      store.dispatch(SalesActions.authorizeSeller({ requestId, sellerId }));

      return actions$.pipe(
        ofType(SalesActions.authorizeSellerSuccess, SalesActions.authorizeSellerFailure),
        filter((action) => action.requestId === requestId),
        take(1),
        map((action) => {
          if (action.type === SalesActions.authorizeSellerFailure.type) {
            window.alert('ID de vendedor no autorizado.');
            return router.parseUrl('/tablero');
          }

          if (!action.authorization.authorized || !action.authorization.seller) {
            window.alert('ID de vendedor no autorizado.');
            return router.parseUrl('/tablero');
          }

          return true;
        })
      );
    })
  );
};
