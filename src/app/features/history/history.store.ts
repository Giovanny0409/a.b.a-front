import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { HistoryActions } from './store/history.actions';
import { selectHistoryExpenses, selectHistoryPurchases, selectHistorySales, selectHistorySummary } from './store/history.selectors';

@Injectable()
export class HistoryStore {
  private readonly store = inject(Store);

  readonly sales = this.store.selectSignal(selectHistorySales);
  readonly purchases = this.store.selectSignal(selectHistoryPurchases);
  readonly expenses = this.store.selectSignal(selectHistoryExpenses);
  readonly summary = this.store.selectSignal(selectHistorySummary);

  load(): void {
    this.store.dispatch(HistoryActions.load());
  }
}
