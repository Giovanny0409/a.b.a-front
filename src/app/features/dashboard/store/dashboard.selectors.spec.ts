import { aLot, aPurchase, aSale, anExpense, anInventoryItem } from '@testing/fixtures';
import { DashboardState, dashboardFeatureKey, initialDashboardState } from './dashboard.reducer';
import {
  selectDashboardExpenses,
  selectDashboardImportance,
  selectDashboardInventory,
  selectDashboardLoading,
  selectDashboardLots,
  selectDashboardSales,
  selectDashboardSummary
} from './dashboard.selectors';

describe('dashboard selectors', () => {
  const state: DashboardState = {
    ...initialDashboardState,
    inventory: [
      anInventoryItem({ sealedBags: 3, needsRestock: true }),
      anInventoryItem({ sealedBags: 7, needsRestock: false })
    ],
    lots: [aLot({ status: 'open' }), aLot({ status: 'sealed' }), aLot({ status: 'open' }), aLot({ status: 'sold' })],
    purchases: [aPurchase({ investment: 600 }), aPurchase({ investment: 250 })],
    sales: [aSale({ total: 400, profit: 80 }), aSale({ total: 150, profit: 30 })],
    expenses: [anExpense({ amount: 50 }), anExpense({ amount: 20 })],
    importance: [{ productId: 'p-1', minBags: 2, minOpenKg: 0, minPieces: 0 }],
    loading: true
  };
  const root = { [dashboardFeatureKey]: state };

  it('expone cada parte del estado', () => {
    expect(selectDashboardInventory(root)).toBe(state.inventory);
    expect(selectDashboardLots(root)).toBe(state.lots);
    expect(selectDashboardSales(root)).toBe(state.sales);
    expect(selectDashboardExpenses(root)).toBe(state.expenses);
    expect(selectDashboardImportance(root)).toBe(state.importance);
    expect(selectDashboardLoading(root)).toBe(true);
  });

  it('calcula el resumen: bultos, dinero, ganancia neta de gastos y productos por surtir', () => {
    expect(selectDashboardSummary(root)).toEqual({
      sealedBags: 10,
      openBags: 2,
      totalBags: 12,
      investment: 850,
      income: 550,
      expenses: 70,
      profit: 40,
      lowStock: 1
    });
  });

  it('da un resumen en ceros sin datos', () => {
    expect(selectDashboardSummary({ [dashboardFeatureKey]: initialDashboardState })).toEqual({
      sealedBags: 0, openBags: 0, totalBags: 0, investment: 0, income: 0, expenses: 0, profit: 0, lowStock: 0
    });
  });
});
