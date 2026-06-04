import { CurrencyPipe, DecimalPipe, NgFor } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardStore } from './dashboard.store';

@Component({
  selector: 'aba-dashboard-page',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, NgFor, RouterLink],
  providers: [DashboardStore],
  template: `
    <section class="metrics">
      <div class="metric">
        <span>Inventario sellado</span>
        <strong>{{ store.summary().bagsAvailable }} bultos</strong>
      </div>
      <div class="metric">
        <span>Kilos abiertos</span>
        <strong>{{ store.summary().openKgAvailable | number: '1.1-2' }} kg</strong>
      </div>
      <div class="metric">
        <span>Ventas acumuladas</span>
        <strong>{{ store.summary().income | currency: 'MXN' }}</strong>
      </div>
      <div class="metric">
        <span>Ganancia visible</span>
        <strong>{{ store.summary().profit | currency: 'MXN' }}</strong>
      </div>
    </section>

    <section class="grid">
      <article class="panel">
        <h2>Productos por cuidar</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Bultos</th>
                <th>Kg abiertos</th>
                <th>Minimo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of store.inventory()">
                <td>{{ item.product.name }}</td>
                <td>{{ item.sealedBags }}</td>
                <td>{{ item.openKg | number: '1.1-2' }}</td>
                <td>{{ item.product.minBags }}</td>
                <td>
                  <span class="badge" [class.danger]="item.needsRestock" [class.ok]="!item.needsRestock">
                    {{ item.needsRestock ? 'Reponer' : 'Suficiente' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel actions">
        <h2>Trabajo rapido</h2>
        <a class="btn" routerLink="/ventas"><i class="pi pi-shopping-cart"></i> Nueva venta</a>
        <a class="btn secondary" routerLink="/compras"><i class="pi pi-plus-circle"></i> Registrar compra</a>
        <a class="btn secondary" routerLink="/inventario"><i class="pi pi-warehouse"></i> Revisar inventario</a>
      </article>
    </section>
  `,
  styles: [`
    .metrics {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin-bottom: 1rem;
    }

    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: minmax(0, 1fr) 18rem;
    }

    .actions {
      align-content: start;
      display: grid;
      gap: 0.75rem;
    }

    @media (max-width: 980px) {
      .metrics,
      .grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 640px) {
      .metrics,
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardPageComponent {
  readonly store = inject(DashboardStore);
}
