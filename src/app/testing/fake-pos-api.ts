// PosApiService falso para los *.spec.ts: cada método es un vi.fn() que la prueba programa con
// mockReturnValue(of(...)) o mockReturnValue(throwError(...)).
import { Mock } from 'vitest';
import { PosApiService } from '@core/pos-api.service';

export type FakePosApi = { [K in keyof PosApiService]: Mock };

export function fakePosApi(): FakePosApi {
  return {
    getProducts: vi.fn(),
    getPurchaseDefaults: vi.fn(),
    getLots: vi.fn(),
    getPurchases: vi.fn(),
    getSales: vi.fn(),
    getExpenses: vi.fn(),
    getSnapshot: vi.fn(),
    getInventory: vi.fn(),
    createProduct: vi.fn(),
    registerPurchase: vi.fn(),
    registerExpense: vi.fn(),
    quoteSale: vi.fn(),
    registerSale: vi.fn(),
    registerSaleBatch: vi.fn(),
    authorizeSeller: vi.fn()
  };
}
