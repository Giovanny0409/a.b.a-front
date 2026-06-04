import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, concatMap, forkJoin, from, map, of, switchMap, tap, toArray } from 'rxjs';
import { DataRefreshService } from '../../core/data-refresh.service';
import { Product, SaleLine, SaleRecord, SaleUnit } from '../../core/pos.models';
import { PosApiService } from '../../core/pos-api.service';

export type SalesEntryMode = SaleUnit | 'money';

export interface PendingSaleLine {
  productId: string;
  mode: SalesEntryMode;
  amount: number;
}

@Injectable()
export class SalesStore {
  private readonly api = inject(PosApiService);
  private readonly refresh = inject(DataRefreshService);
  private readonly productsState = signal<Product[]>([]);
  private readonly salesState = signal<SaleRecord[]>([]);

  readonly products = this.productsState.asReadonly();
  readonly sales = this.salesState.asReadonly();

  load(): void {
    forkJoin({
      products: this.api.getProducts(),
      sales: this.api.getSales()
    }).subscribe({
      next: ({ products, sales }) => {
        this.productsState.set(products);
        this.salesState.set(sales);
      },
      error: () => {
        this.productsState.set([]);
        this.salesState.set([]);
      }
    });
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
    const request = mode === 'money'
      ? this.moneyToKg(productId, amount).pipe(
        switchMap((quantity) => this.api.registerSale({
          customer: customer || 'Publico general',
          productId,
          unit: 'kg',
          quantity
        }))
      )
      : this.api.registerSale({
        customer: customer || 'Publico general',
        productId,
        unit: mode,
        quantity: amount
      });

    return request.pipe(
      tap((sale) => {
        this.salesState.update((sales) => [sale, ...sales]);
        this.refresh.requestRefresh();
      })
    );
  }

  registerSaleBatch(customer: string, lines: PendingSaleLine[]): Observable<SaleRecord> {
    const normalizedCustomer = customer || 'Publico general';

    return from(lines).pipe(
      concatMap((line) => this.registerSale(normalizedCustomer, line.productId, line.mode, line.amount)),
      toArray(),
      map((sales) => {
        const combinedLines = sales.flatMap((sale) => sale.lines);

        return {
          id: sales.map((sale) => sale.id).join(','),
          soldAt: sales[0]?.soldAt ?? new Date().toISOString(),
          customer: normalizedCustomer,
          lines: combinedLines,
          total: combinedLines.reduce((sum, line) => sum + line.total, 0),
          cost: combinedLines.reduce((sum, line) => sum + line.cost, 0),
          profit: combinedLines.reduce((sum, line) => sum + line.profit, 0)
        };
      })
    );
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
