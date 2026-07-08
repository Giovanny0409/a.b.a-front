import { createFeatureSelector, createSelector } from '@ngrx/store';
import { salesFeatureKey, SalesState } from './sales.reducer';

const selectSalesState = createFeatureSelector<SalesState>(salesFeatureKey);

export const selectSalesProducts = createSelector(selectSalesState, (state) => state.products);
export const selectSalesRecords = createSelector(selectSalesState, (state) => state.sales);
export const selectActiveSeller = createSelector(selectSalesState, (state) => state.activeSeller);
export const selectSavedTickets = createSelector(selectSalesState, (state) => state.savedTickets);
