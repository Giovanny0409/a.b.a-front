import { CurrencyPipe, DatePipe, DecimalPipe, NgFor } from '@angular/common';
import { Component, inject } from '@angular/core';
import { InventoryStore } from './inventory.store';

@Component({
  selector: 'aba-inventory-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, NgFor],
  providers: [InventoryStore],
  template: `
    <section class="panel">
      <h2>Inventario vivo</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoria</th>
              <th>Bultos sellados</th>
              <th>Kilos abiertos</th>
              <th>Total kg reales</th>
              <th>Minimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of store.inventory()">
              <td>{{ item.product.name }}</td>
              <td>{{ item.product.category }}</td>
              <td>{{ item.sealedBags }}</td>
              <td>{{ item.openKg | number: '1.1-2' }}</td>
              <td>{{ item.realKgTotal | number: '1.1-2' }}</td>
              <td>{{ item.product.minBags }}</td>
              <td>
                <span class="badge" [class.danger]="item.needsRestock" [class.ok]="!item.needsRestock">
                  {{ item.needsRestock ? 'Compra sugerida' : 'Cubierto' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel lots">
      <h2>Bultos registrados</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Estado</th>
              <th>Kg etiqueta</th>
              <th>Kg reales</th>
              <th>Kg restantes</th>
              <th>Costo/kg real</th>
              <th>Venta bulto</th>
              <th>Venta kg</th>
              <th>Compra</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let lot of store.lots()">
              <td>{{ store.productName(lot.productId) }}</td>
              <td><span class="badge" [class.ok]="lot.status === 'sealed'" [class.warn]="lot.status === 'open'" [class.danger]="lot.status === 'sold'">{{ lot.status }}</span></td>
              <td>{{ lot.markedKg | number: '1.1-2' }}</td>
              <td>{{ lot.realKg | number: '1.1-2' }}</td>
              <td>{{ lot.remainingKg | number: '1.1-2' }}</td>
              <td>{{ lot.purchaseCost / lot.realKg | currency: 'MXN' }}</td>
              <td>{{ lot.salePriceBag | currency: 'MXN' }}</td>
              <td>{{ lot.salePriceKg | currency: 'MXN' }}</td>
              <td>{{ lot.purchasedAt | date: 'dd/MM/yyyy' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .lots {
      margin-top: 1rem;
    }
  `]
})
export class InventoryPageComponent {
  readonly store = inject(InventoryStore);

  constructor() {
    this.store.load();
  }
}
