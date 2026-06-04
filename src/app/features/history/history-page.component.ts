import { CurrencyPipe, DatePipe, DecimalPipe, NgFor } from '@angular/common';
import { Component, inject } from '@angular/core';
import { HistoryStore } from './history.store';

@Component({
  selector: 'aba-history-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, NgFor],
  providers: [HistoryStore],
  template: `
    <section class="metrics">
      <div class="metric">
        <span>Inversion registrada</span>
        <strong>{{ store.summary().investment | currency: 'MXN' }}</strong>
      </div>
      <div class="metric">
        <span>Ventas</span>
        <strong>{{ store.summary().income | currency: 'MXN' }}</strong>
      </div>
      <div class="metric">
        <span>Ganancia</span>
        <strong>{{ store.summary().profit | currency: 'MXN' }}</strong>
      </div>
    </section>

    <section class="history-grid">
      <article class="panel">
        <h2>Historial de ventas</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Total</th>
                <th>Costo</th>
                <th>Ganancia</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sale of store.sales()">
                <td>{{ sale.soldAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ sale.customer }}</td>
                <td>{{ sale.lines[0].productName }}</td>
                <td>{{ sale.lines[0].quantity | number: '1.0-2' }} {{ sale.lines[0].unit === 'kg' ? 'kg' : 'bulto' }}</td>
                <td>{{ sale.total | currency: 'MXN' }}</td>
                <td>{{ sale.cost | currency: 'MXN' }}</td>
                <td>{{ sale.profit | currency: 'MXN' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel">
        <h2>Historial de compras</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Proveedor</th>
                <th>Bultos</th>
                <th>Kg etiqueta</th>
                <th>Kg reales</th>
                <th>Inversion</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let purchase of store.purchases()">
                <td>{{ purchase.purchasedAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ purchase.productName }}</td>
                <td>{{ purchase.supplier }}</td>
                <td>{{ purchase.bags }}</td>
                <td>{{ purchase.markedKg | number: '1.1-2' }}</td>
                <td>{{ purchase.realKg | number: '1.1-2' }}</td>
                <td>{{ purchase.investment | currency: 'MXN' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  `,
  styles: [`
    .metrics,
    .history-grid {
      display: grid;
      gap: 1rem;
    }

    .metrics {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-bottom: 1rem;
    }

    .history-grid {
      grid-template-columns: 1fr;
    }

    @media (max-width: 760px) {
      .metrics {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HistoryPageComponent {
  readonly store = inject(HistoryStore);

  constructor() {
    this.store.load();
  }
}
