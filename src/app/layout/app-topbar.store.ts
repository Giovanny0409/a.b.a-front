import { Injectable, computed, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppTopbarActions } from './store/app-topbar.actions';
import { selectTopbarTotals } from './store/app-topbar.selectors';

@Injectable({ providedIn: 'root' })
export class AppTopbarStore {
  private readonly store = inject(Store);
  private readonly totals = this.store.selectSignal(selectTopbarTotals);

  readonly totalBags = computed(() => this.totals().totalBags);
  readonly openKg = computed(() => this.totals().openKg);

  constructor() {
    this.load();
  }

  load(): void {
    this.store.dispatch(AppTopbarActions.load());
  }
}
