import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter, from, map, of, switchMap, take } from 'rxjs';
import { SalesActions } from '@features/sales/store/sales.actions';
import { selectActiveSeller } from '@features/sales/store/sales.selectors';
import { Notifier } from './notify/notification.service';

export const salesAuthorizationGuard: CanMatchFn = () => {
  const router = inject(Router);
  const store = inject(Store);
  const actions$ = inject(Actions);
  const translate = inject(TranslateService);
  const notifier = inject(Notifier);

  const rejected = () => {
    void notifier.error(translate.instant('seller.rejected'));
    return router.parseUrl('/tablero');
  };

  return store.select(selectActiveSeller).pipe(
    take(1),
    switchMap((activeSeller) => {
      if (activeSeller) {
        return of(true);
      }

      // El ID se escribe oculto, en el diálogo de la app.
      return from(notifier.prompt({ title: translate.instant('seller.askId'), secret: true })).pipe(
        switchMap((sellerId) => {
          if (!sellerId) {
            return of(router.parseUrl('/tablero'));
          }

          const requestId = crypto.randomUUID();
          store.dispatch(SalesActions.authorizeSeller({ requestId, sellerId }));

          return actions$.pipe(
            ofType(SalesActions.authorizeSellerSuccess, SalesActions.authorizeSellerFailure),
            filter((action) => action.requestId === requestId),
            take(1),
            map((action) => {
              if (action.type === SalesActions.authorizeSellerFailure.type) {
                return rejected();
              }

              if (!action.authorization.authorized || !action.authorization.seller) {
                return rejected();
              }

              return true;
            })
          );
        })
      );
    })
  );
};
