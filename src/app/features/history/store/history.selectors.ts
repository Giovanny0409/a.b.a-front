import { createFeatureSelector, createSelector } from '@ngrx/store';
import { historyFeatureKey, HistoryState } from './history.reducer';

const selectHistoryState = createFeatureSelector<HistoryState>(historyFeatureKey);

export const selectHistorySales = createSelector(selectHistoryState, (state) => state.sales);
export const selectHistoryPurchases = createSelector(selectHistoryState, (state) => state.purchases);
export const selectHistoryExpenses = createSelector(selectHistoryState, (state) => state.expenses);
export const selectHistorySummary = createSelector(selectHistoryState, (state) => ({
  investment: state.purchases.reduce((sum, purchase) => sum + purchase.investment, 0),
  income: state.sales.reduce((sum, sale) => sum + sale.total, 0),
  expenses: state.expenses.reduce((sum, expense) => sum + expense.amount, 0),
  profit: state.sales.reduce((sum, sale) => sum + sale.profit, 0) - state.expenses.reduce((sum, expense) => sum + expense.amount, 0)
}));
