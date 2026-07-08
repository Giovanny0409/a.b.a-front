import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { PosApiService } from '../../core/pos-api.service';
import { AppTopbarActions } from './app-topbar.actions';

@Injectable()
export class AppTopbarEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(PosApiService);

  readonly load$ = createEffect(() => this.actions$.pipe(
    ofType(AppTopbarActions.load),
    switchMap(() => this.api.getInventory().pipe(
      map((inventory) => AppTopbarActions.loadSuccess({ inventory })),
      catchError((error) => of(AppTopbarActions.loadFailure({
        error: error?.error?.message ?? 'No fue posible cargar totales de inventario.'
      })))
    ))
  ));
}
