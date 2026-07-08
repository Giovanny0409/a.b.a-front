import { Injectable, inject } from '@angular/core';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable, filter, mergeMap, take, throwError } from 'rxjs';
import { ExpenseRecord, PurchaseLineInput, PurchaseRecord } from '../../core/pos.models';
import { PurchasesActions, RegisterExpenseInput } from './store/purchases.actions';
import { selectPurchaseProducts, selectPurchaseSuppliers } from './store/purchases.selectors';

@Injectable()
export class PurchasesStore {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);

  readonly products = this.store.selectSignal(selectPurchaseProducts);
  readonly suppliers = this.store.selectSignal(selectPurchaseSuppliers);

  loadProducts(): void {
    this.store.dispatch(PurchasesActions.loadProducts());
  }

  addSupplier(supplier: { name: string; phone: string }): void {
    this.store.dispatch(PurchasesActions.addSupplier({ supplier }));
  }

  registerPurchase(input: {
    supplierName: string;
    supplierPhone: string;
    lines: PurchaseLineInput[];
  }): Observable<PurchaseRecord> {
    const requestId = crypto.randomUUID();
    this.store.dispatch(PurchasesActions.registerPurchase({ requestId, input }));

    return this.actions$.pipe(
      ofType(PurchasesActions.registerPurchaseSuccess, PurchasesActions.registerPurchaseFailure),
      filter((action) => action.requestId === requestId),
      take(1),
      mergeMap((action) => {
        if (action.type === PurchasesActions.registerPurchaseFailure.type) {
          return throwError(() => new Error(action.error));
        }

        return [action.purchase];
      })
    );
  }

  registerExpense(input: RegisterExpenseInput): Observable<ExpenseRecord> {
    const requestId = crypto.randomUUID();
    this.store.dispatch(PurchasesActions.registerExpense({ requestId, input }));

    return this.actions$.pipe(
      ofType(PurchasesActions.registerExpenseSuccess, PurchasesActions.registerExpenseFailure),
      filter((action) => action.requestId === requestId),
      take(1),
      mergeMap((action) => {
        if (action.type === PurchasesActions.registerExpenseFailure.type) {
          return throwError(() => new Error(action.error));
        }

        return [action.expense];
      })
    );
  }
}
