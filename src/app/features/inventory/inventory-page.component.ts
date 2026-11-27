import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component, LOCALE_ID, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { InventoryItem } from '@core/pos.models';
import { InventoryStore } from './inventory.store';

@Component({
  selector: 'aba-inventory-page',
  standalone: true,
  imports: [DecimalPipe, NgFor, NgIf, TranslatePipe],
  providers: [InventoryStore],
  template: `
    <section class="panel inventory-panel">
      <div class="head">
        <h2>{{ 'inventory.title' | translate }}</h2>

        <label class="field product-filter">
          <span>{{ 'inventory.filter.label' | translate }}</span>
          <input
            #productFilter
            list="inventory-products"
            [placeholder]="'inventory.filter.placeholder' | translate"
            type="search"
            (input)="filter.set(productFilter.value)"
          >
          <datalist id="inventory-products">
            <option *ngFor="let item of store.inventory()" [value]="item.product.name"></option>
          </datalist>
        </label>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ 'common.fields.product' | translate }}</th>
              <th>{{ 'common.fields.category' | translate }}</th>
              <th>{{ 'inventory.columns.net' | translate }}</th>
              <th>{{ 'inventory.columns.sealedBags' | translate }}</th>
              <th>{{ 'inventory.columns.openKg' | translate }}</th>
              <th>{{ 'inventory.columns.pieces' | translate }}</th>
              <th>{{ 'inventory.columns.minimum' | translate }}</th>
              <th>{{ 'common.fields.status' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredInventory()">
              <td>{{ item.product.name }}</td>
              <td>{{ item.product.category }}</td>
              <td>{{ inventoryTotalLabel(item) }}</td>
              <td>{{ item.sealedBags }}</td>
              <td>{{ item.openKg | number: '1.1-2' }}</td>
              <td>{{ item.quantityTotal ?? 0 }}</td>
              <td>{{ item.product.minBags }}</td>
              <td>
                <span class="badge" [class.danger]="item.needsRestock" [class.ok]="!item.needsRestock">
                  {{ (item.needsRestock ? 'inventory.status.restock' : 'inventory.status.covered') | translate }}
                </span>
              </td>
            </tr>
            <tr *ngIf="filteredInventory().length === 0">
              <td colspan="8" class="empty">{{ 'inventory.filter.empty' | translate }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .inventory-panel {
      display: grid;
      gap: 1rem;
      min-width: 0;
    }

    .head {
      align-items: end;
      display: flex;
      gap: 1rem;
      justify-content: space-between;
    }

    .head h2 {
      margin: 0;
    }

    .product-filter {
      max-width: 22rem;
      width: 100%;
    }

    .empty {
      color: var(--muted);
      font-weight: 800;
      text-align: center;
    }

    @media (max-width: 720px) {
      .head {
        align-items: stretch;
        flex-direction: column;
      }

      .product-filter {
        max-width: none;
      }
    }
  `]
})
export class InventoryPageComponent {
  private readonly translate = inject(TranslateService);
  private readonly decimal = new DecimalPipe(inject(LOCALE_ID));
  readonly store = inject(InventoryStore);
  readonly filter = signal('');

  constructor() {
    this.store.load();
  }

  filteredInventory(): InventoryItem[] {
    const filter = this.filter().trim().toLocaleLowerCase();

    if (!filter) {
      return this.store.inventory();
    }

    return this.store.inventory().filter((item) =>
      item.product.name.toLocaleLowerCase().includes(filter)
    );
  }

  inventoryTotalLabel(item: InventoryItem): string {
    const pieces = item.quantityTotal ?? 0;
    const parts: string[] = [];

    if (item.sealedBags > 0) {
      parts.push(this.translate.instant('common.units.bagsCount', { count: item.sealedBags }));
    }

    if (item.openKg > 0) {
      parts.push(this.translate.instant('common.units.openKg', { kg: this.decimal.transform(item.openKg, '1.0-2') }));
    }

    if (pieces > 0) {
      parts.push(this.translate.instant('common.units.piecesCount', { count: pieces }));
    }

    return parts.length ? parts.join(' / ') : this.translate.instant('inventory.noStock');
  }
}
