import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DashboardSummary } from '@core/pos.models';
import { dashboardFeatureKey, DashboardState } from './dashboard.reducer';

const selectDashboardState = createFeatureSelector<DashboardState>(dashboardFeatureKey);

export const selectDashboardInventory = createSelector(selectDashboardState, (state) => state.inventory);
export const selectDashboardLots = createSelector(selectDashboardState, (state) => state.lots);
export const selectDashboardSales = createSelector(selectDashboardState, (state) => state.sales);
export const selectDashboardExpenses = createSelector(selectDashboardState, (state) => state.expenses);
export const selectDashboardImportance = createSelector(selectDashboardState, (state) => state.importance);
export const selectDashboardLoading = createSelector(selectDashboardState, (state) => state.loading);
export const selectDashboardSummary = createSelector(
  selectDashboardState,
  (state): DashboardSummary => ({
    sealedBags: state.inventory.reduce((sum, item) => sum + item.sealedBags, 0),
    openBags: state.lots.filter((lot) => lot.status === 'open').length,
    totalBags: state.inventory.reduce((sum, item) => sum + item.sealedBags, 0) + state.lots.filter((lot) => lot.status === 'open').length,
    investment: state.purchases.reduce((sum, purchase) => sum + purchase.investment, 0),
    income: state.sales.reduce((sum, sale) => sum + sale.total, 0),
    expenses: state.expenses.reduce((sum, expense) => sum + expense.amount, 0),
    profit: state.sales.reduce((sum, sale) => sum + sale.profit, 0) - state.expenses.reduce((sum, expense) => sum + expense.amount, 0),
    lowStock: state.inventory.filter((item) => item.needsRestock).length
  })
);
