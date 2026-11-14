import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { PosApiService } from '../../../core/pos-api.service';
import { PurchasesActions } from './purchases.actions';

@Injectable()
export class PurchasesEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(PosApiService);

  readonly loadProducts$ = createEffect(() => this.actions$.pipe(
    ofType(PurchasesActions.loadProducts),
    switchMap(() => forkJoin({
      products: this.api.getProducts(),
      purchases: this.api.getPurchases(),
      expenses: this.api.getExpenses().pipe(catchError(() => of([])))
    }).pipe(
      map(({ products, purchases, expenses }) => PurchasesActions.loadProductsSuccess({ products, purchases, expenses })),
      catchError((error) => of(PurchasesActions.loadProductsFailure({
        error: error?.error?.message ?? 'No fue posible cargar productos.'
      })))
    ))
  ));

  readonly registerPurchase$ = createEffect(() => this.actions$.pipe(
    ofType(PurchasesActions.registerPurchase),
    switchMap(({ requestId, input }) => this.api.registerPurchase({
      supplier: {
        name: input.supplierName || 'Sin proveedor',
        phone: input.supplierPhone
      },
      lines: input.lines.map((line) => ({
        kind: line.kind,
        productName: line.productName.trim(),
        category: line.category || 'General',
        quantity: Math.max(1, Number(line.quantity || 1)),
        markedKg: line.kind === 'bag' ? Number(line.markedKg || 0) : undefined,
        purchaseCost: Number(line.purchaseCost || 0),
        salePriceBag: Number(line.salePriceBag || 0),
        salePriceKg: line.kind === 'unit' ? Number(line.salePriceBag || 0) : Number(line.salePriceKg || 0)
      }))
    }).pipe(
        map((purchases) => PurchasesActions.registerPurchaseSuccess({ requestId, purchases })),
        catchError((error) => of(PurchasesActions.registerPurchaseFailure({
          requestId,
          error: error?.error?.message ?? 'No fue posible registrar la compra.'
        })))
      )
    )
  ));

  readonly registerExpense$ = createEffect(() => this.actions$.pipe(
    ofType(PurchasesActions.registerExpense),
    switchMap(({ requestId, input }) => this.api.registerExpense({
      concept: input.concept.trim(),
      category: input.category || 'General',
      area: input.area,
      amount: Number(input.amount || 0),
      notes: input.notes?.trim()
    }).pipe(
      map((expense) => PurchasesActions.registerExpenseSuccess({ requestId, expense })),
      catchError((error) => of(PurchasesActions.registerExpenseFailure({
        requestId,
        error: error?.error?.message ?? 'No fue posible registrar el gasto.'
      })))
    ))
  ));
}
