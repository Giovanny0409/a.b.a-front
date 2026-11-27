import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideI18n } from '@core/i18n/provide-i18n';
import { ExpenseRecord, InventoryItem, SaleRecord } from '@core/pos.models';
import { aProduct, aSale, anExpense, anInventoryItem } from '@testing/fixtures';
import { t } from '@testing/translate';
import { DashboardPageComponent } from './dashboard-page.component';
import { DashboardStore } from './dashboard.store';
import { ProductImportance } from './store/dashboard.actions';

// Jueves 12 de noviembre de 2026, 16:00 hora local. La semana va del lunes 9 al domingo 15.
const NOW = new Date(2026, 10, 12, 16, 0, 0);
const at = (day: number, hour: number) => new Date(2026, 10, day, hour, 0, 0).toISOString();

describe('DashboardPageComponent', () => {
  let fixture: ComponentFixture<DashboardPageComponent>;
  let component: DashboardPageComponent;
  let store: {
    inventory: ReturnType<typeof signal<InventoryItem[]>>;
    sales: ReturnType<typeof signal<SaleRecord[]>>;
    expenses: ReturnType<typeof signal<ExpenseRecord[]>>;
    importance: ReturnType<typeof signal<ProductImportance[]>>;
    summary: ReturnType<typeof signal>;
    setImportance: ReturnType<typeof vi.fn>;
  };

  const bags = anInventoryItem({ product: aProduct({ id: 'p-1', name: 'Maiz', minBags: 4 }), sealedBags: 5, openKg: 12.5, quantityTotal: 0 });
  const pieces = anInventoryItem({ product: aProduct({ id: 'p-2', name: 'Correa', minBags: 0 }), sealedBags: 0, openKg: 0, quantityTotal: 3 });
  const empty = anInventoryItem({ product: aProduct({ id: 'p-3', name: 'Salvado', minBags: 2 }), sealedBags: 0, openKg: 0, quantityTotal: 0 });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    store = {
      inventory: signal([bags, pieces, empty]),
      sales: signal([
        aSale({ id: 'manana', soldAt: at(12, 9), total: 400, profit: 80 }),
        aSale({ id: 'tarde', soldAt: at(12, 15), total: 150, profit: 30 }),
        aSale({ id: 'lunes', soldAt: at(9, 10), total: 1000, profit: 200 }),
        aSale({ id: 'semana-pasada', soldAt: at(8, 10), total: 5000, profit: 900 })
      ]),
      expenses: signal([
        anExpense({ expenseAt: at(12, 10), amount: 20 }),
        anExpense({ expenseAt: at(12, 18), amount: 5 }),
        anExpense({ expenseAt: at(10, 10), amount: 100 })
      ]),
      importance: signal([]),
      summary: signal({ totalBags: 5, sealedBags: 5, openBags: 1, investment: 0, income: 0, expenses: 0, profit: 0, lowStock: 0 }),
      setImportance: vi.fn()
    };
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideI18n()] });
    TestBed.overrideComponent(DashboardPageComponent, {
      set: { providers: [{ provide: DashboardStore, useValue: store }] }
    });
    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('se crea', () => {
    expect(component).toBeTruthy();
  });

  it('corta la caja de hoy en mañana (antes de las 14:00), tarde y total', () => {
    expect(component.dailyCashCuts()).toEqual([
      { labelKey: 'dashboard.cashCut.morning', sales: 1, total: 400, expenses: 20, profit: 60 },
      { labelKey: 'dashboard.cashCut.afternoon', sales: 1, total: 150, expenses: 5, profit: 25 },
      { labelKey: 'dashboard.cashCut.day', sales: 2, total: 550, expenses: 25, profit: 85 }
    ]);
  });

  it('resume la semana de lunes a domingo', () => {
    expect(component.weekStart()).toEqual(new Date(2026, 10, 9, 0, 0, 0, 0));
    expect(component.weekEnd()).toEqual(new Date(2026, 10, 15, 23, 59, 59, 999));
    expect(component.weeklySummary()).toEqual({ sales: 3, income: 1550, expenses: 125, profit: 185 });
  });

  it('en domingo, la semana empieza el lunes anterior', () => {
    vi.setSystemTime(new Date(2026, 10, 15, 12, 0, 0));

    expect(component.weekStart()).toEqual(new Date(2026, 10, 9, 0, 0, 0, 0));
  });

  it('separa productos de bulto y de piezas, y muestra su existencia', () => {
    expect(component.bagInventory()).toEqual([bags, empty]);
    expect(component.unitInventory()).toEqual([pieces]);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(t('common.units.bagsAndOpenKg', { bags: 5, kg: '12.5' }));
    expect(text).toContain(t('common.units.piecesCount', { count: 3 }));
  });

  it('muestra los textos del diccionario, con acentos, y los pesos con «$»', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain(t('dashboard.quickWork.title'));
    expect(text).toContain(t('dashboard.cashCut.day'));
    expect(text).toContain(t('dashboard.importance.minBags'));
    expect(text).toContain(t('common.units.bagsCount', { count: 5 }));
    expect(text).toContain(t('dashboard.week.detail', { profit: '$185.00', expenses: '$125.00', sales: 3 }));
    expect(text).not.toContain('MX$');
  });

  it('usa el mínimo de bultos del producto cuando no hay importancia guardada', () => {
    expect(component.importanceFor(bags)).toEqual({ productId: 'p-1', minBags: 4, minOpenKg: 0, minPieces: 0 });
    expect(component.importanceStatus(bags)).toBe('covered');
    expect(component.importanceStatus(empty)).toBe('review');
    expect(component.productsToReview()).toEqual([empty]);
  });

  it('marca «Revisar» con la importancia guardada de bultos, kilos o piezas', () => {
    store.importance.set([
      { productId: 'p-1', minBags: 1, minOpenKg: 20, minPieces: 0 },
      { productId: 'p-2', minBags: 0, minOpenKg: 0, minPieces: 5 }
    ]);

    expect(component.importanceStatus(bags)).toBe('review');
    expect(component.importanceStatus(pieces)).toBe('review');

    store.importance.set([{ productId: 'p-2', minBags: 0, minOpenKg: 0, minPieces: 3 }]);
    expect(component.importanceStatus(pieces)).toBe('covered');

    fixture.detectChanges();
    const badges = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.importance-panel .badge')]
      .map((badge) => badge.textContent?.trim());
    expect(badges).toContain(t('dashboard.importance.status.covered'));
    expect(badges).toContain(t('dashboard.importance.status.review'));
  });

  it('guarda la importancia de un producto de bulto o de piezas', () => {
    component.saveBagImportance(bags, '6', '');
    component.saveUnitImportance(pieces, '10');

    expect(store.setImportance).toHaveBeenCalledWith({ productId: 'p-1', minBags: 6, minOpenKg: 0, minPieces: 0 });
    expect(store.setImportance).toHaveBeenCalledWith({ productId: 'p-2', minBags: 0, minOpenKg: 0, minPieces: 10 });
  });
});
