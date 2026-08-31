import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ExpenseArea, ExpenseRecord, Product, PurchaseLineInput, PurchaseRecord, Supplier } from '../../../core/pos.models';

export interface RegisterPurchaseInput {
  supplierName: string;
  supplierPhone: string;
  lines: PurchaseLineInput[];
}

export interface RegisterExpenseInput {
  concept: string;
  category: string;
  area: ExpenseArea;
  amount: number;
  notes?: string;
}

export type PurchaseSupplier = Supplier;

export const PurchasesActions = createActionGroup({
  source: 'Purchases',
  events: {
    'Load Products': emptyProps(),
    'Load Products Success': props<{ products: Product[]; purchases: PurchaseRecord[]; expenses: ExpenseRecord[] }>(),
    'Load Products Failure': props<{ error: string }>(),
    'Add Supplier': props<{ supplier: PurchaseSupplier }>(),
    'Register Purchase': props<{ requestId: string; input: RegisterPurchaseInput }>(),
    'Register Purchase Success': props<{ requestId: string; purchases: PurchaseRecord[] }>(),
    'Register Purchase Failure': props<{ requestId: string; error: string }>(),
    'Register Expense': props<{ requestId: string; input: RegisterExpenseInput }>(),
    'Register Expense Success': props<{ requestId: string; expense: ExpenseRecord }>(),
    'Register Expense Failure': props<{ requestId: string; error: string }>()
  }
});
