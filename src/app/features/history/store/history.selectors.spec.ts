import { aPurchase, aSale, anExpense } from '../../../testing/fixtures';
import { HistoryState, historyFeatureKey } from './history.reducer';
import {
  selectHistoryExpenses,
  selectHistoryPurchases,
  selectHistorySales,
  selectHistorySummary
} from './history.selectors';

describe('history selectors', () => {
  const state: HistoryState = {
    sales: [aSale({ total: 400, profit: 80 }), aSale({ total: 100, profit: 25 })],
    purchases: [aPurchase({ investment: 640 })],
    expenses: [anExpense({ amount: 30 })],
    error: null
  };
  const root = { [historyFeatureKey]: state };

  it('expone ventas, compras y gastos', () => {
    expect(selectHistorySales(root)).toBe(state.sales);
    expect(selectHistoryPurchases(root)).toBe(state.purchases);
    expect(selectHistoryExpenses(root)).toBe(state.expenses);
  });

  it('resume inversión, ingreso, gastos y ganancia neta de gastos', () => {
    expect(selectHistorySummary(root)).toEqual({ investment: 640, income: 500, expenses: 30, profit: 75 });
  });
});
