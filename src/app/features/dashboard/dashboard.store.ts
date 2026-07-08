import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { DashboardSummary } from '../../core/pos.models';
import { DashboardActions } from './store/dashboard.actions';
import {
  selectDashboardImportance,
  selectDashboardExpenses,
  selectDashboardInventory,
  selectDashboardLoading,
  selectDashboardLots,
  selectDashboardSales,
  selectDashboardSummary
} from './store/dashboard.selectors';

const emptySummary: DashboardSummary = {
  totalBags: 0,
  sealedBags: 0,
  openBags: 0,
  investment: 0,
  income: 0,
  expenses: 0,
  profit: 0,
  lowStock: 0
};

@Injectable()
export class DashboardStore {
  private readonly store = inject(Store);

  readonly inventory = this.store.selectSignal(selectDashboardInventory);
  readonly lots = this.store.selectSignal(selectDashboardLots);
  readonly sales = this.store.selectSignal(selectDashboardSales);
  readonly expenses = this.store.selectSignal(selectDashboardExpenses);
  readonly importance = this.store.selectSignal(selectDashboardImportance);
  readonly loading = this.store.selectSignal(selectDashboardLoading);
  readonly summary = this.store.selectSignal(selectDashboardSummary);

  constructor() {
    this.load();
  }

  load(): void {
    this.store.dispatch(DashboardActions.load());
  }

  setImportance(input: { productId: string; minBags: number; minOpenKg: number; minPieces: number }): void {
    this.store.dispatch(DashboardActions.setImportance({ importance: input }));
  }

  fallbackSummary(): DashboardSummary {
    return emptySummary;
  }
}
