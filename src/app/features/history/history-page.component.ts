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
        <span>Gastos</span>
        <strong>{{ store.summary().expenses | currency: 'MXN' }}</strong>
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
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Inversion</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let purchase of store.purchases()">
                <td>{{ purchase.purchasedAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ purchase.productName }}</td>
                <td>{{ supplierLabel(purchase) }}</td>
                <td>{{ purchase.kind === 'unit' ? 'Producto' : 'Bulto' }}</td>
                <td>{{ purchaseQuantityLabel(purchase) }}</td>
                <td>{{ purchase.investment | currency: 'MXN' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel">
        <h2>Gastos e insumos</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Categoria</th>
                <th>Apartado</th>
                <th>Monto</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let expense of store.expenses()">
                <td>{{ expense.expenseAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ expense.concept }}</td>
                <td>{{ expense.category }}</td>
                <td>{{ expenseAreaLabel(expense.area) }}</td>
                <td>{{ expense.amount | currency: 'MXN' }}</td>
                <td>{{ expense.notes || '-' }}</td>
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
      grid-template-columns: repeat(4, minmax(0, 1fr));
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

  supplierLabel(purchase: { supplier?: string; supplierName?: string; supplierPhone?: string }): string {
    const name = purchase.supplierName || purchase.supplier || 'Sin proveedor';
    return purchase.supplierPhone ? `${name} (${purchase.supplierPhone})` : name;
  }

  purchaseQuantityLabel(purchase: { kind?: string; quantity?: number; bags?: number; markedKg?: number }): string {
    if (purchase.kind === 'unit') {
      return `${purchase.quantity ?? purchase.bags ?? 0} piezas`;
    }

    return `${purchase.bags ?? 0} bultos / ${purchase.markedKg ?? 0} kg`;
  }

  expenseAreaLabel(area: string): string {
    const labels: Record<string, string> = {
      general: 'General',
      guardadito: 'Guardadito',
      camioneta: 'Camioneta'
    };

    return labels[area] ?? area;
  }
}
