import { CurrencyPipe, DatePipe, DecimalPipe, NgFor } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SaleLine } from '@core/pos.models';
import { saleQuantityKey } from '@core/sale-quantity';
import { HistoryStore } from './history.store';

@Component({
  selector: 'aba-history-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, NgFor, TranslatePipe],
  providers: [HistoryStore],
  template: `
    <section class="metrics">
      <div class="metric">
        <span>{{ 'history.metrics.investment' | translate }}</span>
        <strong>{{ store.summary().investment | currency: 'MXN' }}</strong>
      </div>
      <div class="metric">
        <span>{{ 'common.fields.sales' | translate }}</span>
        <strong>{{ store.summary().income | currency: 'MXN' }}</strong>
      </div>
      <div class="metric">
        <span>{{ 'common.fields.expenses' | translate }}</span>
        <strong>{{ store.summary().expenses | currency: 'MXN' }}</strong>
      </div>
      <div class="metric">
        <span>{{ 'common.fields.profit' | translate }}</span>
        <strong>{{ store.summary().profit | currency: 'MXN' }}</strong>
      </div>
    </section>

    <section class="history-grid">
      <article class="panel">
        <h2>{{ 'history.sales.title' | translate }}</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ 'common.fields.date' | translate }}</th>
                <th>{{ 'common.fields.customer' | translate }}</th>
                <th>{{ 'common.fields.product' | translate }}</th>
                <th>{{ 'common.fields.quantity' | translate }}</th>
                <th>{{ 'common.fields.total' | translate }}</th>
                <th>{{ 'history.sales.cost' | translate }}</th>
                <th>{{ 'common.fields.profit' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let sale of store.sales()">
                <td>{{ sale.soldAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ sale.customer }}</td>
                <td>{{ sale.lines[0].productName }}</td>
                <td>{{ quantityKey(sale.lines[0]) | translate: { quantity: (sale.lines[0].quantity | number: '1.0-2') } }}</td>
                <td>{{ sale.total | currency: 'MXN' }}</td>
                <td>{{ sale.cost | currency: 'MXN' }}</td>
                <td>{{ sale.profit | currency: 'MXN' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel">
        <h2>{{ 'history.purchases.title' | translate }}</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ 'common.fields.date' | translate }}</th>
                <th>{{ 'common.fields.product' | translate }}</th>
                <th>{{ 'common.fields.supplier' | translate }}</th>
                <th>{{ 'purchases.lines.kind' | translate }}</th>
                <th>{{ 'common.fields.quantity' | translate }}</th>
                <th>{{ 'history.purchases.investment' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let purchase of store.purchases()">
                <td>{{ purchase.purchasedAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ purchase.productName }}</td>
                <td>{{ supplierLabel(purchase) }}</td>
                <td>{{ (purchase.kind === 'unit' ? 'history.purchases.kinds.unit' : 'history.purchases.kinds.bag') | translate }}</td>
                <td>{{ purchaseQuantityLabel(purchase) }}</td>
                <td>{{ purchase.investment | currency: 'MXN' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel">
        <h2>{{ 'history.expenses.title' | translate }}</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ 'common.fields.date' | translate }}</th>
                <th>{{ 'expenses.fields.concept' | translate }}</th>
                <th>{{ 'common.fields.category' | translate }}</th>
                <th>{{ 'expenses.fields.area' | translate }}</th>
                <th>{{ 'expenses.fields.amount' | translate }}</th>
                <th>{{ 'expenses.fields.notes' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let expense of store.expenses()">
                <td>{{ expense.expenseAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ expense.concept }}</td>
                <td>{{ expense.category }}</td>
                <td>{{ expenseAreaLabel(expense.area) | translate }}</td>
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
  private readonly translate = inject(TranslateService);
  readonly store = inject(HistoryStore);

  private readonly expenseAreaLabels: Record<string, string> = {
    general: 'expenses.areas.general',
    guardadito: 'expenses.areas.guardadito',
    camioneta: 'expenses.areas.camioneta'
  };

  constructor() {
    this.store.load();
  }

  supplierLabel(purchase: { supplier?: string; supplierName?: string; supplierPhone?: string }): string {
    const name = purchase.supplierName || purchase.supplier || this.translate.instant('history.purchases.noSupplier');
    return purchase.supplierPhone
      ? this.translate.instant('history.purchases.supplierWithPhone', { name, phone: purchase.supplierPhone })
      : name;
  }

  purchaseQuantityLabel(purchase: { kind?: string; quantity?: number; bags?: number; markedKg?: number }): string {
    if (purchase.kind === 'unit') {
      return this.translate.instant('common.units.piecesCount', { count: purchase.quantity ?? purchase.bags ?? 0 });
    }

    return this.translate.instant('history.purchases.bagsAndKg', { bags: purchase.bags ?? 0, kg: purchase.markedKg ?? 0 });
  }

  /** Clave de la cantidad vendida con su unidad real, igual que en el ticket. */
  quantityKey(line: SaleLine): string {
    return saleQuantityKey(line.unit, line.quantity);
  }

  /** Clave del apartado del gasto; un apartado desconocido se devuelve tal cual y se muestra así. */
  expenseAreaLabel(area: string): string {
    return this.expenseAreaLabels[area] ?? area;
  }
}
