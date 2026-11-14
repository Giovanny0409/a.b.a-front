import { createReducer, on } from '@ngrx/store';
import { BagLot, InventoryItem, Product } from '@core/pos.models';
import { InventoryActions } from './inventory.actions';

export const inventoryFeatureKey = 'inventory';

export interface InventoryState {
  inventory: InventoryItem[];
  lots: BagLot[];
  products: Product[];
  error: string | null;
}

export const initialInventoryState: InventoryState = {
  inventory: [],
  lots: [],
  products: [],
  error: null
};

export const inventoryReducer = createReducer(
  initialInventoryState,
  on(InventoryActions.loadSuccess, (state, { inventory, lots, products }) => ({
    ...state,
    inventory,
    lots,
    products,
    error: null
  })),
  on(InventoryActions.loadFailure, (state, { error }) => ({
    ...state,
    inventory: [],
    lots: [],
    products: [],
    error
  }))
);
