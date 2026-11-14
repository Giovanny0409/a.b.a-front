import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { BagLot, ExpenseRecord, InventoryItem, PurchaseRecord, SaleRecord } from '@core/pos.models';

export interface ProductImportance {
  productId: string;
  minBags: number;
  minOpenKg: number;
  minPieces: number;
}

export const DashboardActions = createActionGroup({
  source: 'Dashboard',
  events: {
    'Load': emptyProps(),
    'Load Success': props<{ inventory: InventoryItem[]; lots: BagLot[]; purchases: PurchaseRecord[]; sales: SaleRecord[]; expenses: ExpenseRecord[] }>(),
    'Load Failure': props<{ error: string }>(),
    'Set Importance': props<{ importance: ProductImportance }>()
  }
});
