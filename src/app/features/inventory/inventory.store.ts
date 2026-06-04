import { Injectable, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { BagLot, InventoryItem, Product } from '../../core/pos.models';
import { PosApiService } from '../../core/pos-api.service';

@Injectable()
export class InventoryStore {
  private readonly api = inject(PosApiService);
  private readonly inventoryState = signal<InventoryItem[]>([]);
  private readonly lotsState = signal<BagLot[]>([]);
  private readonly productsState = signal<Product[]>([]);

  readonly inventory = this.inventoryState.asReadonly();
  readonly lots = this.lotsState.asReadonly();

  load(): void {
    forkJoin({
      inventory: this.api.getInventory(),
      lots: this.api.getLots(),
      products: this.api.getProducts()
    }).subscribe({
      next: ({ inventory, lots, products }) => {
        this.inventoryState.set(inventory);
        this.lotsState.set(lots);
        this.productsState.set(products);
      },
      error: () => {
        this.inventoryState.set([]);
        this.lotsState.set([]);
        this.productsState.set([]);
      }
    });
  }

  productName(productId: string): string {
    return this.productsState().find((product) => product.id === productId)?.name ?? 'Producto';
  }
}
