import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { DataRefreshService } from '../../core/data-refresh.service';
import { DashboardSummary, InventoryItem, PurchaseRecord, SaleRecord } from '../../core/pos.models';
import { PosApiService } from '../../core/pos-api.service';

const emptySummary: DashboardSummary = {
  bagsAvailable: 0,
  openKgAvailable: 0,
  investment: 0,
  income: 0,
  profit: 0,
  lowStock: 0
};

@Injectable()
export class DashboardStore {
  private readonly api = inject(PosApiService);
  private readonly refresh = inject(DataRefreshService);
  private readonly inventoryState = signal<InventoryItem[]>([]);
  private readonly purchasesState = signal<PurchaseRecord[]>([]);
  private readonly salesState = signal<SaleRecord[]>([]);
  private readonly loadingState = signal(false);

  readonly inventory = this.inventoryState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly summary = computed<DashboardSummary>(() => ({
    bagsAvailable: this.inventoryState().reduce((sum, item) => sum + item.sealedBags, 0),
    openKgAvailable: this.inventoryState().reduce((sum, item) => sum + item.openKg, 0),
    investment: this.purchasesState().reduce((sum, purchase) => sum + purchase.investment, 0),
    income: this.salesState().reduce((sum, sale) => sum + sale.total, 0),
    profit: this.salesState().reduce((sum, sale) => sum + sale.profit, 0),
    lowStock: this.inventoryState().filter((item) => item.needsRestock).length
  }));

  constructor() {
    effect(() => {
      this.refresh.revision();
      this.load();
    });
  }

  load(): void {
    this.loadingState.set(true);
    forkJoin({
      inventory: this.api.getInventory(),
      purchases: this.api.getPurchases(),
      sales: this.api.getSales()
    }).subscribe({
      next: ({ inventory, purchases, sales }) => {
        this.inventoryState.set(inventory);
        this.purchasesState.set(purchases);
        this.salesState.set(sales);
        this.loadingState.set(false);
      },
      error: () => {
        this.inventoryState.set([]);
        this.purchasesState.set([]);
        this.salesState.set([]);
        this.loadingState.set(false);
      }
    });
  }

  fallbackSummary(): DashboardSummary {
    return emptySummary;
  }
}
