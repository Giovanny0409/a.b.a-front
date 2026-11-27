import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { PosApiService } from '@core/pos-api.service';
import { DashboardActions } from './dashboard.actions';

@Injectable()
export class DashboardEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(PosApiService);

  readonly load$ = createEffect(() => this.actions$.pipe(
    ofType(DashboardActions.load),
    switchMap(() => forkJoin({
      inventory: this.api.getInventory(),
      lots: this.api.getLots(),
      purchases: this.api.getPurchases(),
      sales: this.api.getSales(),
      expenses: this.api.getExpenses().pipe(catchError(() => of([])))
    }).pipe(
      map(({ inventory, lots, purchases, sales, expenses }) => DashboardActions.loadSuccess({ inventory, lots, purchases, sales, expenses })),
      catchError((error) => of(DashboardActions.loadFailure({
        error: error?.error?.message ?? 'dashboard.errors.load'
      })))
    ))
  ));
}
