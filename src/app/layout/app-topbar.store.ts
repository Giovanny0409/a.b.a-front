import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { PosApiService } from '../core/pos-api.service';
import { DataRefreshService } from '../core/data-refresh.service';

@Injectable({ providedIn: 'root' })
export class AppTopbarStore {
  private readonly api = inject(PosApiService);
  private readonly refresh = inject(DataRefreshService);
  private readonly sealedBagsState = signal(0);
  private readonly openKgState = signal(0);

  readonly totalBags = computed(() => this.sealedBagsState());
  readonly openKg = computed(() => this.openKgState());

  constructor() {
    effect(() => {
      this.refresh.revision();
      this.load();
    });
  }

  load(): void {
    this.api.getInventory().subscribe({
      next: (inventory) => {
        this.sealedBagsState.set(inventory.reduce((sum, item) => sum + item.sealedBags, 0));
        this.openKgState.set(inventory.reduce((sum, item) => sum + item.openKg, 0));
      },
      error: () => {
        this.sealedBagsState.set(0);
        this.openKgState.set(0);
      }
    });
  }
}
