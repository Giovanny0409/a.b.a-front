import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideI18n } from '../../core/i18n/provide-i18n';
import { aPurchase, aSale, anExpense } from '../../testing/fixtures';
import { t } from '../../testing/translate';
import { HistoryPageComponent } from './history-page.component';
import { HistoryStore } from './history.store';

describe('HistoryPageComponent', () => {
  let component: HistoryPageComponent;
  let element: HTMLElement;
  let load: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    load = vi.fn();
    TestBed.configureTestingModule({ providers: [provideI18n()] });
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
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('se crea y carga el historial', () => {
    expect(component).toBeTruthy();
    expect(load).toHaveBeenCalled();
  });

  it('muestra el proveedor con su teléfono, o el texto libre, o «Sin proveedor»', () => {
    expect(component.supplierLabel({ supplierName: 'Granos', supplierPhone: '555' }))
      .toBe(t('history.purchases.supplierWithPhone', { name: 'Granos', phone: '555' }));
    expect(component.supplierLabel({ supplier: 'Forrajes Sur' })).toBe('Forrajes Sur');
    expect(component.supplierLabel({})).toBe(t('history.purchases.noSupplier'));
  });

  it('describe la cantidad comprada en piezas o en bultos y kilos', () => {
    expect(component.purchaseQuantityLabel({ kind: 'unit', quantity: 5 })).toBe(t('common.units.piecesCount', { count: 5 }));
    expect(component.purchaseQuantityLabel({ kind: 'bag', bags: 3, markedKg: 40 })).toBe(t('history.purchases.bagsAndKg', { bags: 3, kg: 40 }));
    expect(component.purchaseQuantityLabel({})).toBe(t('history.purchases.bagsAndKg', { bags: 0, kg: 0 }));
  });

  it('da la clave del área del gasto, o el área tal cual si no la conoce', () => {
    expect(component.expenseAreaLabel('general')).toBe('expenses.areas.general');
    expect(component.expenseAreaLabel('guardadito')).toBe('expenses.areas.guardadito');
    expect(component.expenseAreaLabel('camioneta')).toBe('expenses.areas.camioneta');
    expect(component.expenseAreaLabel('otra')).toBe('otra');
  });

  it('muestra los textos del diccionario, con acentos, y los pesos con «$»', () => {
    expect(element.textContent).toContain(t('history.metrics.investment'));
    expect(element.textContent).toContain(t('history.purchases.investment'));
    expect(element.textContent).toContain('$640.00');
    expect(element.textContent).not.toContain('MX$');
  });
});
