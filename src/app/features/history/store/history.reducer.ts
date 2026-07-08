import { createReducer, on } from '@ngrx/store';
import { ExpenseRecord, PurchaseRecord, SaleRecord } from '../../../core/pos.models';
import { HistoryActions } from './history.actions';

export const historyFeatureKey = 'history';

export interface HistoryState {
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  expenses: ExpenseRecord[];
  error: string | null;
}

export const initialHistoryState: HistoryState = {
  sales: [],
  purchases: [],
  expenses: [],
  error: null
};

export const historyReducer = createReducer(
  initialHistoryState,
  on(HistoryActions.loadSuccess, (state, { sales, purchases, expenses }) => ({
    ...state,
    sales,
    purchases,
    expenses,
    error: null
  })),
  on(HistoryActions.loadFailure, (state, { error }) => ({
    ...state,
    sales: [],
    purchases: [],
    expenses: [],
    error
  }))
);
