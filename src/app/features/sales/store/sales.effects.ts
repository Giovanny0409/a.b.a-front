import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { PosApiService } from '../../../core/pos-api.service';
import { SalesActions } from './sales.actions';

@Injectable()
export class SalesEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(PosApiService);

  readonly load$ = createEffect(() => this.actions$.pipe(
    ofType(SalesActions.load),
    switchMap(() => forkJoin({
      products: this.api.getProducts(),
      sales: this.api.getSales(),
      inventory: this.api.getInventory()
    }).pipe(
      map((loaded) => SalesActions.loadSuccess(loaded)),
      catchError((error) => of(SalesActions.loadFailure({
        error: error?.error?.message ?? 'sales.errors.load'
      })))
    ))
  ));

  readonly authorizeSeller$ = createEffect(() => this.actions$.pipe(
    ofType(SalesActions.authorizeSeller),
    switchMap(({ requestId, sellerId }) => this.api.authorizeSeller(sellerId).pipe(
      map((authorization) => SalesActions.authorizeSellerSuccess({ requestId, authorization })),
      catchError((error) => of(SalesActions.authorizeSellerFailure({
        requestId,
        error: error?.error?.message ?? 'seller.rejected'
      })))
    ))
  ));

  readonly registerSaleBatch$ = createEffect(() => this.actions$.pipe(
    ofType(SalesActions.registerSaleBatch),
    switchMap(({ requestId, input }) => this.api.registerSaleBatch(input).pipe(
      map((sale) => SalesActions.registerSaleBatchSuccess({ requestId, sale })),
      catchError((error) => of(SalesActions.registerSaleBatchFailure({
        requestId,
        error: error?.error?.message ?? 'sales.errors.register'
      })))
    ))
  ));
}
