import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { InventoryActions } from './store/inventory.actions';
import { selectInventoryItems, selectInventoryLots, selectInventoryProducts } from './store/inventory.selectors';

@Injectable()
export class InventoryStore {
  private readonly store = inject(Store);

  readonly inventory = this.store.selectSignal(selectInventoryItems);
  readonly lots = this.store.selectSignal(selectInventoryLots);
  readonly products = this.store.selectSignal(selectInventoryProducts);

  load(): void {
    this.store.dispatch(InventoryActions.load());
  }

  productName(productId: string): string {
    return this.products().find((product) => product.id === productId)?.name ?? 'Producto';
  }
}
