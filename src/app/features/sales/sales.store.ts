import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable, catchError, filter, forkJoin, map, mergeMap, of, switchMap, take, throwError } from 'rxjs';
import { InventoryItem, ProductKind, SaleLine, SaleRecord, SaleUnit } from '@core/pos.models';
import { PosApiService } from '@core/pos-api.service';
import { SalesActions, SavedTicket } from './store/sales.actions';
import {
  selectActiveSeller,
  selectSalesInventory,
  selectSalesProducts,
  selectSalesRecords,
  selectSavedTickets
} from './store/sales.selectors';

export type SalesEntryMode = SaleUnit | 'money';

export interface PendingSaleLine {
  productId: string;
  mode: SalesEntryMode;
  amount: number;
}

@Injectable()
export class SalesStore {
  private readonly api = inject(PosApiService);
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly router = inject(Router);

  readonly products = this.store.selectSignal(selectSalesProducts);
  readonly sales = this.store.selectSignal(selectSalesRecords);
  readonly activeSeller = this.store.selectSignal(selectActiveSeller);
  readonly savedTickets = this.store.selectSignal(selectSavedTickets);
  private readonly inventory = this.store.selectSignal(selectSalesInventory);

  /** Tipo del producto: decide qué modos de venta se ofrecen. */
  productKind(productId: string): ProductKind | undefined {
    return this.products().find((product) => product.id === productId)?.kind;
  }

  /** Existencia del producto, o `undefined` si no tiene. */
  stock(productId: string): InventoryItem | undefined {
    return this.inventory().find((item) => item.product.id === productId);
  }

  /**
   * Quita al vendedor activo y vuelve a entrar a Ventas: el router reconoce otra vez la ruta y el guard
   * de vendedor pide el ID. Si se cancela, el guard regresa al tablero. Los tickets guardados se conservan.
   */
  changeSeller(): Promise<boolean> {
    this.store.dispatch(SalesActions.clearSeller());
    return this.router.navigateByUrl('/ventas', { onSameUrlNavigation: 'reload' });
  }

  load(): void {
    this.store.dispatch(SalesActions.load());
  }

  quoteSale(productId: string, mode: SalesEntryMode, amount: number): Observable<SaleLine | null> {
    if (!productId || amount <= 0) {
      return of(null);
    }

    if (mode === 'money') {
      return this.quoteMoneySale(productId, amount);
    }

    return this.api.quoteSale(productId, mode, amount).pipe(
      catchError(() => of(null))
    );
  }

  registerSale(customer: string, productId: string, mode: SalesEntryMode, amount: number): Observable<SaleRecord> {
    return this.registerSaleBatch(customer, [{ productId, mode, amount }]);
  }

  registerSaleBatch(customer: string, lines: PendingSaleLine[]): Observable<SaleRecord> {
    const normalizedCustomer = customer || 'Publico general';
    const sellerId = this.activeSeller()?.id;

    if (!sellerId) {
      return throwError(() => new Error('sales.errors.sellerNotAuthorized'));
    }

    const requestId = crypto.randomUUID();

    return forkJoin(lines.map((line) => this.toBackendLine(line))).pipe(
      switchMap((backendLines) => {
        this.store.dispatch(SalesActions.registerSaleBatch({
          requestId,
          input: {
            customer: normalizedCustomer,
            sellerId,
            lines: backendLines
          }
        }));

        return this.actions$.pipe(
          ofType(SalesActions.registerSaleBatchSuccess, SalesActions.registerSaleBatchFailure),
          filter((action) => action.requestId === requestId),
          take(1),
          mergeMap((action) => {
            if (action.type === SalesActions.registerSaleBatchFailure.type) {
              return throwError(() => new Error(action.error));
            }

            return [action.sale];
          })
        );
      })
    );
  }

  saveTicket(ticket: SavedTicket): void {
    this.store.dispatch(SalesActions.saveTicket({ ticket }));
  }

  deleteSavedTicket(saleId: string): void {
    this.store.dispatch(SalesActions.deleteSavedTicket({ saleId }));
  }

  private toBackendLine(line: PendingSaleLine): Observable<{ productId: string; unit: SaleUnit; quantity: number }> {
    if (line.mode === 'money') {
      return this.moneyToKg(line.productId, line.amount).pipe(
        map((quantity) => ({
          productId: line.productId,
          unit: 'kg' as SaleUnit,
          quantity
        }))
      );
    }

    return of({
      productId: line.productId,
      unit: line.mode,
      quantity: line.amount
    });
  }

  private quoteMoneySale(productId: string, amount: number): Observable<SaleLine | null> {
    return this.moneyToKg(productId, amount).pipe(
      switchMap((quantity) => this.api.quoteSale(productId, 'kg', quantity)),
      map((quote) => ({
        ...quote,
        total: amount,
        profit: amount - quote.cost
      })),
      catchError(() => of(null))
    );
  }

  private moneyToKg(productId: string, amount: number): Observable<number> {
    return this.api.quoteSale(productId, 'kg', 1).pipe(
      map((quote) => amount / quote.unitPrice)
    );
  }
}
