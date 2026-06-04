import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, tap, throwError } from 'rxjs';
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
    const sellerId = sessionStorage.getItem('abaSellerId');

    if (!sellerId) {
      return throwError(() => new Error('Vendedor no autorizado para registrar ventas.'));
    }

    const request = mode === 'money'
      ? this.moneyToKg(productId, amount).pipe(
        switchMap((quantity) => this.api.registerSale({
          customer: customer || 'Publico general',
          sellerId,
          productId,
          unit: 'kg',
          quantity
        }))
      )
      : this.api.registerSale({
        customer: customer || 'Publico general',
        sellerId,
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
    const sellerId = sessionStorage.getItem('abaSellerId');

    if (!sellerId) {
      return throwError(() => new Error('Vendedor no autorizado para registrar ventas.'));
    }

    return forkJoin(lines.map((line) => this.toBackendLine(line))).pipe(
      switchMap((backendLines) => this.api.registerSaleBatch({
        customer: normalizedCustomer,
        sellerId,
        lines: backendLines
      })),
      tap((sale) => {
        this.salesState.update((sales) => [sale, ...sales]);
        this.refresh.requestRefresh();
      })
    );
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
