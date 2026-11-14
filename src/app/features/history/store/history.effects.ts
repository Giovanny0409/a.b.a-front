import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { PosApiService } from '../../../core/pos-api.service';
import { HistoryActions } from './history.actions';

@Injectable()
export class HistoryEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(PosApiService);

  readonly load$ = createEffect(() => this.actions$.pipe(
    ofType(HistoryActions.load),
    switchMap(() => forkJoin({
      sales: this.api.getSales(),
      purchases: this.api.getPurchases(),
      expenses: this.api.getExpenses().pipe(catchError(() => of([])))
    }).pipe(
      map(({ sales, purchases, expenses }) => HistoryActions.loadSuccess({ sales, purchases, expenses })),
      catchError((error) => of(HistoryActions.loadFailure({
        error: error?.error?.message ?? 'history.errors.load'
      })))
    ))
  ));
}
