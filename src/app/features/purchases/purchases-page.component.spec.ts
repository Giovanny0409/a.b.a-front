import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { aProduct, aPurchase, anExpense } from '../../testing/fixtures';
import { PurchasesPageComponent } from './purchases-page.component';
import { PurchasesStore } from './purchases.store';

describe('PurchasesPageComponent', () => {
  let fixture: ComponentFixture<PurchasesPageComponent>;
  let component: PurchasesPageComponent;
  let store: {
    products: ReturnType<typeof signal>;
    suppliers: ReturnType<typeof signal>;
    loadProducts: ReturnType<typeof vi.fn>;
    addSupplier: ReturnType<typeof vi.fn>;
    registerPurchase: ReturnType<typeof vi.fn>;
    registerExpense: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    store = {
      products: signal([aProduct()]),
      suppliers: signal([{ name: 'Granos del Norte', phone: '5551234567' }]),
      loadProducts: vi.fn(),
      addSupplier: vi.fn(),
      registerPurchase: vi.fn(() => of([aPurchase()])),
      registerExpense: vi.fn(() => of(anExpense()))
    };
    TestBed.overrideComponent(PurchasesPageComponent, {
      set: { providers: [{ provide: PurchasesStore, useValue: store }] }
    });
    fixture = TestBed.createComponent(PurchasesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function fillLine(index: number, values: Record<string, unknown>): void {
    component.lines.at(index).patchValue(values);
  }

  const bagLine = {
    kind: 'bag', productName: 'Maiz', category: 'Grano', quantity: 3, markedKg: 40,
    purchaseCost: 900, salePriceBag: 400, salePriceKg: 11
  };
  const unitLine = {
    kind: 'unit', productName: 'Correa', category: 'Accesorio', quantity: 5,
    purchaseCost: 250, salePriceBag: 80, salePriceKg: 0
  };

  it('se crea y carga productos', () => {
    expect(component).toBeTruthy();
    expect(store.loadProducts).toHaveBeenCalled();
  });

  it('llena el teléfono al escribir un proveedor conocido, sin importar mayúsculas', () => {
    component.form.controls.supplierName.setValue('granos del NORTE');
    expect(component.form.controls.supplierPhone.value).toBe('5551234567');

    component.form.controls.supplierName.setValue('Nuevo');
    expect(component.form.controls.supplierPhone.value).toBe('');
  });

  it('suma inversión, bultos y piezas de las líneas', () => {
    fillLine(0, bagLine);
    component.addLine();
    fillLine(1, unitLine);

    expect(component.totalInvestment()).toBe(1150);
    expect(component.totalBags()).toBe(3);
    expect(component.totalPieces()).toBe(5);
    expect(component.isBagLine(0)).toBe(true);
    expect(component.isBagLine(1)).toBe(false);
  });

  it('no quita la única línea, pero sí una de varias', () => {
    component.removeLine(0);
    expect(component.lines.length).toBe(1);

    component.addLine();
    component.removeLine(1);
    expect(component.lines.length).toBe(1);
  });

  it('no guarda un formulario inválido', () => {
    component.save();

    expect(store.registerPurchase).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it('pide el precio por kilo de cada línea de bultos', () => {
    component.form.controls.supplierName.setValue('Granos del Norte');
    fillLine(0, { ...bagLine, salePriceKg: 0 });

    component.save();

    expect(store.registerPurchase).not.toHaveBeenCalled();
    expect(component.message()).toBe('Captura el precio de venta por kilo en todos los bultos.');
  });

  it('manda la compra a la fachada, avisa y reinicia las líneas', () => {
    component.form.controls.supplierName.setValue('Granos del Norte');
    fillLine(0, bagLine);
    component.addLine();
    fillLine(1, unitLine);

    component.save();

    expect(store.registerPurchase).toHaveBeenCalledWith({
      supplierName: 'Granos del Norte',
      supplierPhone: '5551234567',
      lines: [
        { ...bagLine },
        { ...unitLine, markedKg: undefined, salePriceKg: 80 }
      ]
    });
    expect(component.message()).toBe('Compra registrada en el backend e inventario actualizado.');
    expect(component.lines.length).toBe(1);
    expect(component.lines.at(0).controls.productName.value).toBe('');
  });

  it('muestra el error del backend si la compra falla', () => {
    store.registerPurchase.mockReturnValue(throwError(() => new Error('Sin red')));
    component.form.controls.supplierName.setValue('Granos del Norte');
    fillLine(0, bagLine);

    component.save();

    expect(component.message()).toBe('Sin red');
    expect(component.lines.at(0).controls.productName.value).toBe('Maiz');
  });

  it('da de alta un proveedor y lo deja elegido en la compra', () => {
    component.toggleSupplierToolbar();
    expect(component.supplierToolbarOpen()).toBe(true);
    component.supplierForm.setValue({ name: 'Forrajes Sur', phone: '777' });

    component.saveSupplier();

    expect(store.addSupplier).toHaveBeenCalledWith({ name: 'Forrajes Sur', phone: '777' });
    expect(component.form.controls.supplierName.value).toBe('Forrajes Sur');
    expect(component.supplierToolbarOpen()).toBe(false);
  });

  it('no da de alta un proveedor sin nombre', () => {
    component.saveSupplier();

    expect(store.addSupplier).not.toHaveBeenCalled();
  });

  it('registra un gasto, avisa y limpia el formulario', () => {
    component.expenseForm.setValue({ concept: 'Luz', category: 'Luz', area: 'camioneta', amount: 300, notes: '' });
    expect(component.expenseAmount()).toBe(300);

    component.saveExpense();

    expect(store.registerExpense).toHaveBeenCalledWith({
      concept: 'Luz', category: 'Luz', area: 'camioneta', amount: 300, notes: ''
    });
    expect(component.expenseMessage()).toBe('Gasto registrado y descontado de ganancias.');
    expect(component.expenseForm.getRawValue()).toEqual({
      concept: '', category: 'Insumos', area: 'general', amount: 0, notes: ''
    });
  });

  it('no registra un gasto sin concepto o sin monto, y muestra el error del backend', () => {
    component.saveExpense();
    expect(store.registerExpense).not.toHaveBeenCalled();

    store.registerExpense.mockReturnValue(throwError(() => new Error('Monto inválido')));
    component.expenseForm.patchValue({ concept: 'Luz', amount: 10 });
    component.saveExpense();
    expect(component.expenseMessage()).toBe('Monto inválido');
  });
});
