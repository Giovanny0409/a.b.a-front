import { createFeatureSelector, createSelector } from '@ngrx/store';
import { appTopbarFeatureKey, AppTopbarState } from './app-topbar.reducer';

const selectAppTopbarState = createFeatureSelector<AppTopbarState>(appTopbarFeatureKey);

export const selectTopbarTotals = createSelector(selectAppTopbarState, (state) => ({
  totalBags: state.inventory.reduce((sum, item) => sum + item.sealedBags, 0),
  openKg: state.inventory.reduce((sum, item) => sum + item.openKg, 0)
}));
