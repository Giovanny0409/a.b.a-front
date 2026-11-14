import { createReducer, on } from '@ngrx/store';
import { InventoryItem } from '@core/pos.models';
import { AppTopbarActions } from './app-topbar.actions';

export const appTopbarFeatureKey = 'appTopbar';

export interface AppTopbarState {
  inventory: InventoryItem[];
  error: string | null;
}

export const initialAppTopbarState: AppTopbarState = {
  inventory: [],
  error: null
};

export const appTopbarReducer = createReducer(
  initialAppTopbarState,
  on(AppTopbarActions.loadSuccess, (state, { inventory }) => ({ ...state, inventory, error: null })),
  on(AppTopbarActions.loadFailure, (state, { error }) => ({ ...state, inventory: [], error }))
);
