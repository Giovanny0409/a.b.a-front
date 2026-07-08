import { createFeatureSelector, createSelector } from '@ngrx/store';
import { inventoryFeatureKey, InventoryState } from './inventory.reducer';

const selectInventoryState = createFeatureSelector<InventoryState>(inventoryFeatureKey);

export const selectInventoryItems = createSelector(selectInventoryState, (state) => state.inventory);
export const selectInventoryLots = createSelector(selectInventoryState, (state) => state.lots);
export const selectInventoryProducts = createSelector(selectInventoryState, (state) => state.products);
