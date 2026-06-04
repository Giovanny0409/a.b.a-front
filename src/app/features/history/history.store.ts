import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { PurchaseRecord, SaleRecord } from '../../core/pos.models';
import { PosApiService } from '../../core/pos-api.service';

@Injectable()
export class HistoryStore {
  private readonly api = inject(PosApiService);
  private readonly salesState = signal<SaleRecord[]>([]);
  private readonly purchasesState = signal<PurchaseRecord[]>([]);

  readonly sales = this.salesState.asReadonly();
  readonly purchases = this.purchasesState.asReadonly();
  readonly summary = computed(() => ({
    investment: this.purchasesState().reduce((sum, purchase) => sum + purchase.investment, 0),
    income: this.salesState().reduce((sum, sale) => sum + sale.total, 0),
    profit: this.salesState().reduce((sum, sale) => sum + sale.profit, 0)
  }));

  load(): void {
    forkJoin({
      sales: this.api.getSales(),
      purchases: this.api.getPurchases()
    }).subscribe({
      next: ({ sales, purchases }) => {
        this.salesState.set(sales);
        this.purchasesState.set(purchases);
      },
      error: () => {
        this.salesState.set([]);
        this.purchasesState.set([]);
      }
    });
  }
}
