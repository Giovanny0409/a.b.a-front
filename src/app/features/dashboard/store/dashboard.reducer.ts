import { createReducer, on } from '@ngrx/store';
import { BagLot, ExpenseRecord, InventoryItem, PurchaseRecord, SaleRecord } from '@core/pos.models';
import { DashboardActions, ProductImportance } from './dashboard.actions';

export const dashboardFeatureKey = 'dashboard';

export interface DashboardState {
  inventory: InventoryItem[];
  lots: BagLot[];
  purchases: PurchaseRecord[];
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  importance: ProductImportance[];
  loading: boolean;
  error: string | null;
}

export const initialDashboardState: DashboardState = {
  inventory: [],
  lots: [],
  purchases: [],
  sales: [],
  expenses: [],
  importance: [],
  loading: false,
  error: null
};

export const dashboardReducer = createReducer(
  initialDashboardState,
  on(DashboardActions.load, (state) => ({ ...state, loading: true, error: null })),
  on(DashboardActions.loadSuccess, (state, { inventory, lots, purchases, sales, expenses }) => ({
    ...state,
    inventory,
    lots,
    purchases,
    sales,
    expenses,
    loading: false
  })),
  on(DashboardActions.loadFailure, (state, { error }) => ({
    ...state,
    inventory: [],
    lots: [],
    purchases: [],
    sales: [],
    expenses: [],
    loading: false,
    error
  })),
  on(DashboardActions.setImportance, (state, { importance }) => ({
    ...state,
    importance: [
      ...state.importance.filter((current) => current.productId !== importance.productId),
      importance
    ]
  }))
);
