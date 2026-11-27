import { createFeatureSelector, createSelector } from '@ngrx/store';
import { purchasesFeatureKey, PurchasesState } from './purchases.reducer';

const selectPurchasesState = createFeatureSelector<PurchasesState>(purchasesFeatureKey);

export const selectPurchaseProducts = createSelector(selectPurchasesState, (state) => state.products);
export const selectPurchaseDefaults = createSelector(selectPurchasesState, (state) => state.purchaseDefaults);
export const selectPurchaseSuppliers = createSelector(selectPurchasesState, (state) => state.suppliers);
