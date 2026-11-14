import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
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
  imports: [CurrencyPipe, NgFor, NgIf, ReactiveFormsModule, TranslatePipe],
  providers: [PurchasesStore],
  template: `
    <section class="panel purchase-panel">
      <div class="head">
        <h2>{{ 'purchases.title' | translate }}</h2>
        <button class="btn secondary" type="button" (click)="toggleSupplierToolbar()">
          <i class="pi pi-user-plus"></i>
          {{ 'purchases.supplier.new' | translate }}
        </button>
      </div>

      <form class="supplier-toolbar" *ngIf="supplierToolbarOpen()" [formGroup]="supplierForm" (ngSubmit)="saveSupplier()">
        <label class="field">
          <span>{{ 'common.fields.supplier' | translate }}</span>
          <input formControlName="name" [placeholder]="'purchases.supplier.namePlaceholder' | translate">
        </label>
        <label class="field">
          <span>{{ 'purchases.supplier.phone' | translate }}</span>
          <input formControlName="phone" [placeholder]="'purchases.supplier.phonePlaceholder' | translate">
        </label>
        <div class="toolbar-actions">
          <button class="btn" type="submit"><i class="pi pi-check"></i> {{ 'purchases.supplier.register' | translate }}</button>
          <button class="btn secondary" type="button" (click)="closeSupplierToolbar()">{{ 'common.actions.cancel' | translate }}</button>
        </div>
      </form>

      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="ticket-bar">
          <label class="field">
            <span>{{ 'common.fields.supplier' | translate }}</span>
            <input formControlName="supplierName" list="purchase-suppliers" [placeholder]="'purchases.supplier.selectPlaceholder' | translate">
            <datalist id="purchase-suppliers">
              <option *ngFor="let supplier of store.suppliers()" [value]="supplier.name">
                {{ supplier.phone }}
              </option>
            </datalist>
          </label>

          <div class="ticket-actions">
            <button class="btn secondary" type="button" (click)="addLine()">
              <i class="pi pi-plus"></i>
              {{ 'purchases.lines.add' | translate }}
            </button>
          </div>
        </div>

        <div class="table-wrap">
          <table class="purchase-total-table" formArrayName="lines">
            <thead>
              <tr>
                <th>{{ 'purchases.lines.kind' | translate }}</th>
                <th>{{ 'common.fields.product' | translate }}</th>
                <th>{{ 'common.fields.category' | translate }}</th>
                <th>{{ 'common.fields.quantity' | translate }}</th>
                <th>{{ 'purchases.lines.markedKg' | translate }}</th>
                <th>{{ 'purchases.lines.cost' | translate }}</th>
                <th>{{ 'purchases.lines.salePriceBag' | translate }}</th>
                <th>{{ 'purchases.lines.salePriceKg' | translate }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let line of lines.controls; let i = index" [formGroupName]="i">
                <td>
                  <select formControlName="kind">
                    <option value="bag">{{ 'purchases.kinds.bag' | translate }}</option>
                    <option value="unit">{{ 'purchases.kinds.unit' | translate }}</option>
                  </select>
                </td>
                <td>
                  <input formControlName="productName" list="purchase-products" [placeholder]="'common.fields.product' | translate">
                </td>
                <td>
                  <input formControlName="category" list="purchase-categories" [placeholder]="'common.fields.category' | translate">
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
                  <button class="icon-btn" type="button" [title]="'common.actions.removeProduct' | translate" (click)="removeLine(i)" [disabled]="lines.length === 1">
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
        <!-- Las categorías se guardan tal cual como dato del producto. -->
        <datalist id="purchase-categories">
          <option value="Alimento"></option>
          <option value="Medicamento"></option>
          <option value="Accesorio"></option>
          <option value="Comedero"></option>
          <option value="General"></option>
        </datalist>

        <footer class="totals">
          <span>{{ 'purchases.totals.products' | translate }} <strong>{{ lines.length }}</strong></span>
          <span>{{ 'purchases.totals.bags' | translate }} <strong>{{ totalBags() }}</strong></span>
          <span>{{ 'purchases.totals.pieces' | translate }} <strong>{{ totalPieces() }}</strong></span>
          <span>{{ 'purchases.totals.investment' | translate }} <strong>{{ totalInvestment() | currency: 'MXN' }}</strong></span>
          <button class="btn" type="submit"><i class="pi pi-save"></i> {{ 'purchases.save' | translate }}</button>
        </footer>
      </form>

      <p class="notice" *ngIf="message()">{{ message() }}</p>
    </section>

    <section class="panel expense-panel">
      <div class="head">
        <h2>{{ 'expenses.title' | translate }}</h2>
      </div>

      <form class="expense-form" [formGroup]="expenseForm" (ngSubmit)="saveExpense()">
        <label class="field">
          <span>{{ 'expenses.fields.concept' | translate }}</span>
          <input formControlName="concept" [placeholder]="'expenses.fields.conceptPlaceholder' | translate">
        </label>
        <!-- Los valores de categoría y apartado se guardan tal cual; solo la etiqueta sale del diccionario. -->
        <label class="field">
          <span>{{ 'common.fields.category' | translate }}</span>
          <select formControlName="category">
            <option value="Renta">{{ 'expenses.categories.rent' | translate }}</option>
            <option value="Luz">{{ 'expenses.categories.power' | translate }}</option>
            <option value="Bolsas">{{ 'expenses.categories.bags' | translate }}</option>
            <option value="Comida">{{ 'expenses.categories.food' | translate }}</option>
            <option value="Insumos">{{ 'expenses.categories.supplies' | translate }}</option>
            <option value="Otro">{{ 'expenses.categories.other' | translate }}</option>
          </select>
        </label>
        <label class="field">
          <span>{{ 'expenses.fields.area' | translate }}</span>
          <select formControlName="area">
            <option value="general">{{ 'expenses.areas.general' | translate }}</option>
            <option value="guardadito">{{ 'expenses.areas.guardadito' | translate }}</option>
            <option value="camioneta">{{ 'expenses.areas.camioneta' | translate }}</option>
          </select>
        </label>
        <label class="field">
          <span>{{ 'expenses.fields.amount' | translate }}</span>
          <input formControlName="amount" type="number" min="0.01" step="0.01" placeholder="0">
        </label>
        <label class="field notes-field">
          <span>{{ 'expenses.fields.notes' | translate }}</span>
          <input formControlName="notes" [placeholder]="'expenses.fields.notesPlaceholder' | translate">
        </label>
        <footer class="expense-actions">
          <span>{{ 'expenses.deducted' | translate }} <strong>{{ expenseAmount() | currency: 'MXN' }}</strong></span>
          <button class="btn" type="submit"><i class="pi pi-save"></i> {{ 'expenses.save' | translate }}</button>
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
  private readonly translate = inject(TranslateService);
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
      this.message.set(this.translate.instant('purchases.messages.missingKgPrice'));
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
        this.message.set(this.translate.instant('purchases.messages.registered'));
        this.lines.clear();
        this.lines.push(this.createLine());
      },
      error: (error) => {
        // Un mensaje del backend no es una clave: instant() lo devuelve tal cual.
        this.message.set(this.translate.instant(error?.error?.message ?? error?.message ?? 'purchases.errors.register'));
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
        this.expenseMessage.set(this.translate.instant('expenses.messages.registered'));
        this.expenseForm.reset({
          concept: '',
          category: 'Insumos',
          area: 'general',
          amount: 0,
          notes: ''
        });
      },
      error: (error) => {
        this.expenseMessage.set(this.translate.instant(error?.message ?? 'expenses.errors.register'));
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
