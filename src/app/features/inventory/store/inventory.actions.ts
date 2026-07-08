import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { BagLot, InventoryItem, Product } from '../../../core/pos.models';

export const InventoryActions = createActionGroup({
  source: 'Inventory',
  events: {
    'Load': emptyProps(),
    'Load Success': props<{ inventory: InventoryItem[]; lots: BagLot[]; products: Product[] }>(),
    'Load Failure': props<{ error: string }>()
  }
});
