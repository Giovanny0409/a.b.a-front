import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { ExpenseArea, PurchaseKind } from '../../core/pos.models';
import { PurchasesStore } from './purchases.store';

type PurchaseLineForm = FormGroup<{
  kind: FormControl<PurchaseKind>;
  productName: FormControl<string>;
  category: FormControl<string>;
  quantity: FormControl<number>;
  markedKg: FormControl<number>;
  purchaseCost: FormControl<number>;
  salePriceBag: FormControl<number>;
  salePriceKg: FormControl<number>;
}>;

@Component({
  selector: 'aba-purchases-page',
  standalone: true,
  imports: [CurrencyPipe, NgFor, NgIf, ReactiveFormsModule],
  providers: [PurchasesStore],
  template: `
    <section class="panel purchase-panel">
      <div class="head">
        <h2>Registrar compra</h2>
        <button class="btn secondary" type="button" (click)="toggleSupplierToolbar()">
          <i class="pi pi-user-plus"></i>
          Nuevo proveedor
        </button>
      </div>

      <form class="supplier-toolbar" *ngIf="supplierToolbarOpen()" [formGroup]="supplierForm" (ngSubmit)="saveSupplier()">
        <label class="field">
          <span>Proveedor</span>
          <input formControlName="name" placeholder="Nombre comercial">
        </label>
        <label class="field">
          <span>Numero</span>
          <input formControlName="phone" placeholder="Telefono o WhatsApp">
        </label>
        <div class="toolbar-actions">
          <button class="btn" type="submit"><i class="pi pi-check"></i> Registrar</button>
          <button class="btn secondary" type="button" (click)="closeSupplierToolbar()">Cancelar</button>
        </div>
      </form>

      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="ticket-bar">
          <label class="field">
            <span>Proveedor</span>
            <input formControlName="supplierName" list="purchase-suppliers" placeholder="Selecciona proveedor">
            <datalist id="purchase-suppliers">
              <option *ngFor="let supplier of store.suppliers()" [value]="supplier.name">
                {{ supplier.phone }}
              </option>
            </datalist>
          </label>

          <div class="ticket-actions">
            <button class="btn secondary" type="button" (click)="addLine()">
              <i class="pi pi-plus"></i>
              Producto
            </button>
          </div>
        </div>

        <div class="table-wrap">
          <table class="purchase-total-table" formArrayName="lines">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Categoria</th>
                <th>Cantidad</th>
                <th>Kg/bulto</th>
                <th>Costo total</th>
                <th>Venta bulto/u.</th>
                <th>Venta kg</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let line of lines.controls; let i = index" [formGroupName]="i">
                <td>
                  <select formControlName="kind">
                    <option value="bag">Bultos</option>
                    <option value="unit">Varios</option>
                  </select>
                </td>
                <td>
                  <input formControlName="productName" list="purchase-products" placeholder="Producto">
                </td>
                <td>
                  <input formControlName="category" list="purchase-categories" placeholder="Categoria">
                </td>
                <td>
                  <input formControlName="quantity" type="number" min="1" step="1">
                </td>
                <td>
                  <input *ngIf="isBagLine(i)" formControlName="markedKg" type="number" min="0" step="0.01">
                  <span *ngIf="!isBagLine(i)" class="muted-cell">-</span>
                </td>
                <td>
                  <input formControlName="purchaseCost" type="number" min="0" step="0.01">
                </td>
                <td>
                  <input formControlName="salePriceBag" type="number" min="0" step="0.01">
                </td>
                <td>
                  <input *ngIf="isBagLine(i)" formControlName="salePriceKg" type="number" min="0" step="0.01">
                  <span *ngIf="!isBagLine(i)" class="muted-cell">-</span>
                </td>
                <td>
                  <button class="icon-btn" type="button" title="Quitar producto" (click)="removeLine(i)" [disabled]="lines.length === 1">
                    <i class="pi pi-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <datalist id="purchase-products">
          <option *ngFor="let product of store.products()" [value]="product.name"></option>
        </datalist>
        <datalist id="purchase-categories">
          <option value="Alimento"></option>
          <option value="Medicamento"></option>
          <option value="Accesorio"></option>
          <option value="Comedero"></option>
          <option value="General"></option>
        </datalist>

        <footer class="totals">
          <span>Productos: <strong>{{ lines.length }}</strong></span>
          <span>Bultos: <strong>{{ totalBags() }}</strong></span>
          <span>Piezas: <strong>{{ totalPieces() }}</strong></span>
          <span>Inversion: <strong>{{ totalInvestment() | currency: 'MXN' }}</strong></span>
          <button class="btn" type="submit"><i class="pi pi-save"></i> Guardar compra</button>
        </footer>
      </form>

      <p class="notice" *ngIf="message()">{{ message() }}</p>
    </section>

    <section class="panel expense-panel">
      <div class="head">
        <h2>Compra de insumos y gastos</h2>
      </div>

      <form class="expense-form" [formGroup]="expenseForm" (ngSubmit)="saveExpense()">
        <label class="field">
          <span>Concepto</span>
          <input formControlName="concept" placeholder="Renta, luz, bolsas, comida">
        </label>
        <label class="field">
          <span>Categoria</span>
          <select formControlName="category">
            <option value="Renta">Renta</option>
            <option value="Luz">Luz</option>
            <option value="Bolsas">Bolsas</option>
            <option value="Comida">Comida</option>
            <option value="Insumos">Insumos</option>
            <option value="Otro">Otro</option>
          </select>
        </label>
        <label class="field">
          <span>Apartado</span>
          <select formControlName="area">
            <option value="general">General</option>
            <option value="guardadito">Guardadito</option>
            <option value="camioneta">Camioneta</option>
          </select>
        </label>
        <label class="field">
          <span>Monto</span>
          <input formControlName="amount" type="number" min="0.01" step="0.01" placeholder="0">
        </label>
        <label class="field notes-field">
          <span>Notas</span>
          <input formControlName="notes" placeholder="Detalle opcional">
        </label>
        <footer class="expense-actions">
          <span>Se descuenta de ganancias: <strong>{{ expenseAmount() | currency: 'MXN' }}</strong></span>
          <button class="btn" type="submit"><i class="pi pi-save"></i> Guardar gasto</button>
        </footer>
      </form>

      <p class="notice" *ngIf="expenseMessage()">{{ expenseMessage() }}</p>
    </section>
  `,
  styles: [`
    .purchase-panel {
      display: grid;
      gap: 1rem;
      min-width: 0;
    }

    .head,
    .ticket-bar {
      align-items: center;
      display: flex;
      gap: 1rem;
      justify-content: space-between;
    }

    .head h2 {
      margin: 0;
    }

    .ticket-bar {
      align-items: end;
      display: grid;
      grid-template-columns: minmax(12rem, 24rem) auto;
      margin-bottom: 1rem;
    }

    .ticket-bar .field {
      width: 100%;
    }

    .ticket-actions {
      display: flex;
      justify-content: flex-end;
      min-width: 0;
    }

    .supplier-toolbar {
      align-items: end;
      background: var(--surface-soft);
      border: 1px solid var(--line);
      border-radius: 8px;
      display: grid;
      gap: 0.8rem;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
      padding: 0.85rem;
    }

    .table-wrap {
      max-width: 100%;
      overflow-x: auto;
    }

    .toolbar-actions {
      display: flex;
      gap: 0.5rem;
    }

    .purchase-total-table {
      min-width: 980px;
      table-layout: fixed;
    }

    .purchase-total-table th:nth-child(1),
    .purchase-total-table td:nth-child(1) {
      width: 5.5rem;
    }

    .purchase-total-table th:nth-child(2),
    .purchase-total-table td:nth-child(2),
    .purchase-total-table th:nth-child(3),
    .purchase-total-table td:nth-child(3) {
      width: 9.5rem;
    }

    .purchase-total-table th:nth-child(4),
    .purchase-total-table td:nth-child(4),
    .purchase-total-table th:nth-child(5),
    .purchase-total-table td:nth-child(5),
    .purchase-total-table th:nth-child(6),
    .purchase-total-table td:nth-child(6),
    .purchase-total-table th:nth-child(7),
    .purchase-total-table td:nth-child(7),
    .purchase-total-table th:nth-child(8),
    .purchase-total-table td:nth-child(8) {
      width: 8rem;
    }

    .purchase-total-table th:nth-child(9),
    .purchase-total-table td:nth-child(9) {
      width: 3.5rem;
    }

    .purchase-total-table input,
    .purchase-total-table select {
      border: 1px solid var(--line);
      border-radius: 8px;
      min-height: 2.35rem;
      padding: 0.45rem;
      width: 100%;
    }

    .muted-cell {
      color: var(--muted);
      display: inline-flex;
      font-weight: 800;
      justify-content: center;
      width: 100%;
    }

    .icon-btn {
      background: #fde2e0;
      border-radius: 8px;
      color: var(--danger);
      height: 2.25rem;
      width: 2.25rem;
    }

    .icon-btn:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }

    .totals {
      align-items: center;
      background: var(--surface-soft);
      border-radius: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      justify-content: space-between;
      margin-top: 1rem;
      padding: 0.75rem;
    }

    .totals .btn {
      margin-left: auto;
      max-width: 100%;
      white-space: nowrap;
    }

    .notice {
      color: var(--ok);
      font-weight: 800;
      margin: 0;
    }

    .expense-panel {
      margin-top: 1rem;
    }

    .expense-form {
      display: grid;
      gap: 0.8rem;
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr) minmax(0, 0.8fr) minmax(0, 0.7fr);
    }

    .notes-field,
    .expense-actions {
      grid-column: 1 / -1;
    }

    .expense-actions {
      align-items: center;
      background: var(--surface-soft);
      border-radius: 8px;
      display: flex;
      gap: 1rem;
      justify-content: space-between;
      padding: 0.75rem;
    }

    @media (max-width: 980px) {
      .supplier-toolbar {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 620px) {
      .head,
      .toolbar-actions {
        align-items: stretch;
        flex-direction: column;
      }

      .ticket-bar {
        grid-template-columns: 1fr;
      }

      .ticket-actions {
        justify-content: stretch;
      }

      .ticket-actions .btn {
        width: 100%;
      }

      .supplier-toolbar {
        grid-template-columns: 1fr;
      }

      .totals {
        align-items: stretch;
        flex-direction: column;
      }

      .expense-form {
        grid-template-columns: 1fr;
      }

      .expense-actions {
        align-items: stretch;
        flex-direction: column;
      }

      .totals .btn {
        margin-left: 0;
        width: 100%;
      }
    }
  `]
})
export class PurchasesPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly store = inject(PurchasesStore);
  readonly message = signal('');
  readonly expenseMessage = signal('');
  readonly supplierToolbarOpen = signal(false);

  readonly form = this.fb.nonNullable.group({
    supplierName: ['', Validators.required],
    supplierPhone: [''],
    lines: this.fb.array([this.createLine()])
  });

  readonly supplierForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: ['']
  });

  readonly expenseForm = this.fb.nonNullable.group({
    concept: ['', Validators.required],
    category: ['Insumos', Validators.required],
    area: ['general' as ExpenseArea, Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    notes: ['']
  });

  constructor() {
    this.store.loadProducts();
    this.form.controls.supplierName.valueChanges.pipe(
      startWith(this.form.controls.supplierName.value),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((supplierName) => {
      const supplier = this.store.suppliers().find(
        (currentSupplier) => currentSupplier.name.toLocaleLowerCase() === supplierName.toLocaleLowerCase()
      );

      this.form.controls.supplierPhone.setValue(supplier?.phone ?? '');
    });
  }

  get lines(): FormArray<PurchaseLineForm> {
    return this.form.controls.lines;
  }

  isBagLine(index: number): boolean {
    return this.lines.at(index).controls.kind.value === 'bag';
  }

  addLine(): void {
    this.lines.push(this.createLine());
  }

  removeLine(index: number): void {
    if (this.lines.length > 1) {
      this.lines.removeAt(index);
    }
  }

  totalInvestment(): number {
    return this.lines.controls.reduce((sum, line) => sum + Number(line.controls.purchaseCost.value || 0), 0);
  }

  totalBags(): number {
    return this.lines.controls
      .filter((line) => line.controls.kind.value === 'bag')
      .reduce((sum, line) => sum + Number(line.controls.quantity.value || 0), 0);
  }

  totalPieces(): number {
    return this.lines.controls
      .filter((line) => line.controls.kind.value === 'unit')
      .reduce((sum, line) => sum + Number(line.controls.quantity.value || 0), 0);
  }

  expenseAmount(): number {
    return Number(this.expenseForm.controls.amount.value || 0);
  }

  toggleSupplierToolbar(): void {
    this.supplierToolbarOpen.update((open) => !open);
  }

  closeSupplierToolbar(): void {
    this.supplierToolbarOpen.set(false);
    this.supplierForm.reset();
  }

  saveSupplier(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    const supplier = this.supplierForm.getRawValue();
    this.store.addSupplier(supplier);
    this.form.patchValue({
      supplierName: supplier.name,
      supplierPhone: supplier.phone
    });
    this.closeSupplierToolbar();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const invalidBagLine = this.lines.controls.find(
      (line) => line.controls.kind.value === 'bag' && Number(line.controls.salePriceKg.value || 0) <= 0
    );
    if (invalidBagLine) {
      invalidBagLine.controls.salePriceKg.markAsTouched();
      this.message.set('Captura el precio de venta por kilo en todos los bultos.');
      return;
    }

    const value = this.form.getRawValue();
    this.store.registerPurchase({
      supplierName: value.supplierName,
      supplierPhone: value.supplierPhone,
      lines: value.lines.map((line) => ({
        kind: line.kind,
        productName: line.productName,
        category: line.category || 'General',
        quantity: line.quantity,
        markedKg: line.kind === 'bag' ? line.markedKg : undefined,
        purchaseCost: line.purchaseCost,
        salePriceBag: line.salePriceBag,
        salePriceKg: line.kind === 'bag' ? line.salePriceKg : line.salePriceBag
      }))
    }).subscribe({
      next: () => {
        this.message.set('Compra registrada en el backend e inventario actualizado.');
        this.lines.clear();
        this.lines.push(this.createLine());
      },
      error: (error) => {
        this.message.set(error?.error?.message ?? error?.message ?? 'No fue posible registrar la compra en el backend.');
      }
    });
  }

  saveExpense(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    const value = this.expenseForm.getRawValue();
    this.store.registerExpense({
      concept: value.concept,
      category: value.category,
      area: value.area,
      amount: value.amount,
      notes: value.notes
    }).subscribe({
      next: () => {
        this.expenseMessage.set('Gasto registrado y descontado de ganancias.');
        this.expenseForm.reset({
          concept: '',
          category: 'Insumos',
          area: 'general',
          amount: 0,
          notes: ''
        });
      },
      error: (error) => {
        this.expenseMessage.set(error?.message ?? 'No fue posible registrar el gasto en el backend.');
      }
    });
  }

  private createLine(): PurchaseLineForm {
    return this.fb.nonNullable.group({
      kind: ['bag' as PurchaseKind, Validators.required],
      productName: ['', Validators.required],
      category: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      markedKg: [40, [Validators.required, Validators.min(0.01)]],
      purchaseCost: [0, [Validators.required, Validators.min(0.01)]],
      salePriceBag: [0, [Validators.required, Validators.min(0.01)]],
      salePriceKg: [0, [Validators.min(0)]]
    });
  }
}
