import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { aPurchase, aSale, anExpense } from '../../testing/fixtures';
import { HistoryPageComponent } from './history-page.component';
import { HistoryStore } from './history.store';

describe('HistoryPageComponent', () => {
  let component: HistoryPageComponent;
  let load: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    load = vi.fn();
    TestBed.overrideComponent(HistoryPageComponent, {
      set: {
        providers: [{
          provide: HistoryStore,
          useValue: {
            sales: signal([aSale()]),
            purchases: signal([aPurchase()]),
            expenses: signal([anExpense()]),
            summary: signal({ investment: 640, income: 400, expenses: 100, profit: -20 }),
            load
          }
        }]
      }
    });
    const fixture = TestBed.createComponent(HistoryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('se crea y carga el historial', () => {
    expect(component).toBeTruthy();
    expect(load).toHaveBeenCalled();
  });

  it('muestra el proveedor con su teléfono, o el texto libre, o «Sin proveedor»', () => {
    expect(component.supplierLabel({ supplierName: 'Granos', supplierPhone: '555' })).toBe('Granos (555)');
    expect(component.supplierLabel({ supplier: 'Forrajes Sur' })).toBe('Forrajes Sur');
    expect(component.supplierLabel({})).toBe('Sin proveedor');
  });

  it('describe la cantidad comprada en piezas o en bultos y kilos', () => {
    expect(component.purchaseQuantityLabel({ kind: 'unit', quantity: 5 })).toBe('5 piezas');
    expect(component.purchaseQuantityLabel({ kind: 'bag', bags: 3, markedKg: 40 })).toBe('3 bultos / 40 kg');
    expect(component.purchaseQuantityLabel({})).toBe('0 bultos / 0 kg');
  });

  it('traduce el área del gasto', () => {
    expect(component.expenseAreaLabel('general')).toBe('General');
    expect(component.expenseAreaLabel('guardadito')).toBe('Guardadito');
    expect(component.expenseAreaLabel('camioneta')).toBe('Camioneta');
    expect(component.expenseAreaLabel('otra')).toBe('otra');
  });
});
