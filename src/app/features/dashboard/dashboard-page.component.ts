import { CurrencyPipe, DatePipe, NgFor } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExpenseRecord, InventoryItem, SaleRecord } from '../../core/pos.models';
import { DashboardStore } from './dashboard.store';
import { ProductImportance } from './store/dashboard.actions';

interface CashCut {
  label: string;
  sales: number;
  total: number;
  expenses: number;
  profit: number;
}

@Component({
  selector: 'aba-dashboard-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, NgFor, RouterLink],
  providers: [DashboardStore],
  template: `
    <section class="metrics">
      <div class="metric">
        <span>Bultos totales</span>
        <strong>{{ store.summary().totalBags }} bultos</strong>
      </div>
      <div class="metric">
        <span>Bultos sellados</span>
        <strong>{{ store.summary().sealedBags }} bultos</strong>
      </div>
      <div class="metric">
        <span>Bultos abiertos</span>
        <strong>{{ store.summary().openBags }} bultos</strong>
      </div>
      <div class="metric">
        <span>Gastos registrados</span>
        <strong>{{ store.summary().expenses | currency: 'MXN' }}</strong>
      </div>
    </section>

    <section class="report-grid">
      <article class="panel cash-cut-panel">
        <h2>Corte de caja diario</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Turno</th>
                <th>Ventas</th>
                <th>Total</th>
                <th>Gastos</th>
                <th>Ganancia</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cut of dailyCashCuts()">
                <td>{{ cut.label }}</td>
                <td>{{ cut.sales }}</td>
                <td>{{ cut.total | currency: 'MXN' }}</td>
                <td>{{ cut.expenses | currency: 'MXN' }}</td>
                <td>{{ cut.profit | currency: 'MXN' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel">
        <h2>Semana actual</h2>
        <div class="week-summary">
          <span>{{ weekStart() | date: 'dd/MM/yyyy' }} - {{ weekEnd() | date: 'dd/MM/yyyy' }}</span>
          <strong>{{ weeklySummary().income | currency: 'MXN' }}</strong>
          <small>Ganancia neta {{ weeklySummary().profit | currency: 'MXN' }} / Gastos {{ weeklySummary().expenses | currency: 'MXN' }} / {{ weeklySummary().sales }} ventas</small>
        </div>
      </article>

      <article class="panel actions">
        <h2>Trabajo rapido</h2>
        <a class="btn" routerLink="/ventas"><i class="pi pi-shopping-cart"></i> Nueva venta</a>
        <a class="btn secondary" routerLink="/compras"><i class="pi pi-plus-circle"></i> Registrar compra</a>
        <a class="btn secondary" routerLink="/inventario"><i class="pi pi-warehouse"></i> Revisar inventario</a>
      </article>
    </section>

    <section class="panel importance-panel">
      <h2>Niveles de importancia</h2>
      <h3>Bultos</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Actual</th>
              <th>Min. bultos</th>
              <th>Min. kg abiertos</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of bagInventory()">
              <td>{{ item.product.name }}</td>
              <td>{{ bagInventoryLabel(item) }}</td>
              <td>
                <input #minBags type="number" min="0" step="1" [value]="importanceFor(item).minBags">
              </td>
              <td>
                <input #minOpenKg type="number" min="0" step="0.01" [value]="importanceFor(item).minOpenKg">
              </td>
              <td>
                <button
                  class="btn secondary compact"
                  type="button"
                  (click)="saveBagImportance(item, minBags.value, minOpenKg.value)"
                >
                  Guardar
                </button>
                <span class="badge" [class.danger]="importanceStatus(item) === 'Revisar'" [class.ok]="importanceStatus(item) === 'Cubierto'">
                  {{ importanceStatus(item) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Productos varios</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Actual</th>
              <th>Min. piezas</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of unitInventory()">
              <td>{{ item.product.name }}</td>
              <td>{{ unitInventoryLabel(item) }}</td>
              <td>
                <input #minPieces type="number" min="0" step="1" [value]="importanceFor(item).minPieces">
              </td>
              <td>
                <button
                  class="btn secondary compact"
                  type="button"
                  (click)="saveUnitImportance(item, minPieces.value)"
                >
                  Guardar
                </button>
                <span class="badge" [class.danger]="importanceStatus(item) === 'Revisar'" [class.ok]="importanceStatus(item) === 'Cubierto'">
                  {{ importanceStatus(item) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .metrics,
    .report-grid {
      display: grid;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .metrics {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .report-grid {
      grid-template-columns: minmax(0, 1.2fr) minmax(18rem, 0.8fr) 18rem;
    }

    .actions {
      align-content: start;
      display: grid;
      gap: 0.75rem;
    }

    .week-summary {
      background: var(--surface-soft);
      border-radius: 8px;
      display: grid;
      gap: 0.4rem;
      padding: 1rem;
    }

    .week-summary span,
    .week-summary small {
      color: var(--muted);
      font-weight: 800;
    }

    .week-summary strong {
      font-size: clamp(1.35rem, 2vw, 2rem);
    }

    .cash-cut-panel table {
      min-width: 0;
    }

    .cash-cut-panel th,
    .cash-cut-panel td {
      padding: 0.45rem 0.6rem;
    }

    .importance-panel input {
      border: 1px solid var(--line);
      border-radius: 8px;
      min-height: 2.25rem;
      padding: 0.4rem;
      width: 7rem;
    }

    .importance-panel h3 {
      color: var(--muted);
      font-size: 0.9rem;
      margin: 1rem 0 0.5rem;
      text-transform: uppercase;
    }

    .importance-panel h3:first-of-type {
      margin-top: 0.25rem;
    }

    .compact {
      min-height: 2.2rem;
      padding: 0.35rem 0.65rem;
    }

    td .badge {
      margin-left: 0.5rem;
      vertical-align: middle;
    }

    @media (max-width: 1100px) {
      .metrics,
      .report-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 700px) {
      .metrics,
      .report-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardPageComponent {
  readonly store = inject(DashboardStore);

  dailyCashCuts(): CashCut[] {
    const todaySales = this.store.sales().filter((sale) => this.isToday(sale.soldAt));
    const todayExpenses = this.store.expenses().filter((expense) => this.isToday(expense.expenseAt));
    return [
      this.cashCut(
        'Mañana',
        todaySales.filter((sale) => new Date(sale.soldAt).getHours() < 14),
        todayExpenses.filter((expense) => new Date(expense.expenseAt).getHours() < 14)
      ),
      this.cashCut(
        'Tarde',
        todaySales.filter((sale) => new Date(sale.soldAt).getHours() >= 14),
        todayExpenses.filter((expense) => new Date(expense.expenseAt).getHours() >= 14)
      ),
      this.cashCut('Total dia', todaySales, todayExpenses)
    ];
  }

  weeklySummary(): { sales: number; income: number; expenses: number; profit: number } {
    const start = this.weekStart();
    const end = this.weekEnd();
    const weeklySales = this.store.sales().filter((sale) => {
      const soldAt = new Date(sale.soldAt);
      return soldAt >= start && soldAt <= end;
    });
    const weeklyExpenses = this.store.expenses().filter((expense) => {
      const expenseAt = new Date(expense.expenseAt);
      return expenseAt >= start && expenseAt <= end;
    });
    const expenses = weeklyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    return {
      sales: weeklySales.length,
      income: weeklySales.reduce((sum, sale) => sum + sale.total, 0),
      expenses,
      profit: weeklySales.reduce((sum, sale) => sum + sale.profit, 0) - expenses
    };
  }

  weekStart(): Date {
    const date = new Date();
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(date);
    start.setDate(date.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  weekEnd(): Date {
    const end = new Date(this.weekStart());
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  productsToReview(): InventoryItem[] {
    return this.store.inventory().filter((item) => this.importanceStatus(item) === 'Revisar');
  }

  bagInventory(): InventoryItem[] {
    return this.store.inventory().filter((item) => this.isBagItem(item));
  }

  unitInventory(): InventoryItem[] {
    return this.store.inventory().filter((item) => !this.isBagItem(item));
  }

  importanceFor(item: InventoryItem): ProductImportance {
    return this.store.importance().find((importance) => importance.productId === item.product.id) ?? {
      productId: item.product.id,
      minBags: item.product.minBags,
      minOpenKg: 0,
      minPieces: 0
    };
  }

  importanceStatus(item: InventoryItem): 'Cubierto' | 'Revisar' {
    const importance = this.importanceFor(item);

    if (this.isBagItem(item)) {
      if (item.sealedBags < importance.minBags) {
        return 'Revisar';
      }

      if (item.openKg < importance.minOpenKg) {
        return 'Revisar';
      }

      return 'Cubierto';
    }

    const pieces = item.quantityTotal ?? 0;
    if (pieces < importance.minPieces) {
      return 'Revisar';
    }

    return 'Cubierto';
  }

  saveBagImportance(item: InventoryItem, minBags: string, minOpenKg: string): void {
    this.store.setImportance({
      productId: item.product.id,
      minBags: Number(minBags || 0),
      minOpenKg: Number(minOpenKg || 0),
      minPieces: 0
    });
  }

  saveUnitImportance(item: InventoryItem, minPieces: string): void {
    this.store.setImportance({
      productId: item.product.id,
      minBags: 0,
      minOpenKg: 0,
      minPieces: Number(minPieces || 0)
    });
  }

  bagInventoryLabel(item: InventoryItem): string {
    return `${item.sealedBags} bultos / ${item.openKg.toLocaleString('es-MX', { maximumFractionDigits: 2 })} kg abiertos`;
  }

  unitInventoryLabel(item: InventoryItem): string {
    const pieces = item.quantityTotal ?? 0;
    return `${pieces} piezas`;
  }

  private cashCut(label: string, sales: SaleRecord[], expenses: ExpenseRecord[]): CashCut {
    const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return {
      label,
      sales: sales.length,
      total: sales.reduce((sum, sale) => sum + sale.total, 0),
      expenses: expenseTotal,
      profit: sales.reduce((sum, sale) => sum + sale.profit, 0) - expenseTotal
    };
  }

  private isToday(value: string): boolean {
    const date = new Date(value);
    const today = new Date();
    return date.getFullYear() === today.getFullYear()
      && date.getMonth() === today.getMonth()
      && date.getDate() === today.getDate();
  }

  private isBagItem(item: InventoryItem): boolean {
    return item.sealedBags > 0 || item.openKg > 0 || (item.quantityTotal ?? 0) === 0;
  }
}
