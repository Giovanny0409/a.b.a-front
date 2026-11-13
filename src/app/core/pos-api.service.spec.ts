import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { PosApiService } from './pos-api.service';

const API = 'http://localhost:5028/api';

describe('PosApiService', () => {
  let service: PosApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PosApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it.each([
    ['getProducts', `${API}/products`],
    ['getLots', `${API}/inventory/lots`],
    ['getPurchases', `${API}/purchases`],
    ['getSales', `${API}/sales`],
    ['getExpenses', `${API}/expenses`],
    ['getInventory', `${API}/inventory`]
  ] as const)('%s hace GET a %s', (method, url) => {
    let response: unknown;
    const call: () => Observable<unknown> = () => service[method]();
    call().subscribe((value) => (response = value));

    const request = http.expectOne(url);
    expect(request.request.method).toBe('GET');
    request.flush([{ id: '1' }]);

    expect(response).toEqual([{ id: '1' }]);
  });

  it('registerPurchase manda el proveedor y las líneas por POST', () => {
    const input = {
      supplier: { name: 'Granos del Norte', phone: '555' },
      lines: [{
        kind: 'bag' as const,
        productName: 'Maiz',
        category: 'Grano',
        quantity: 2,
        markedKg: 40,
        purchaseCost: 600,
        salePriceBag: 400,
        salePriceKg: 11
      }]
    };

    service.registerPurchase(input).subscribe();

    const request = http.expectOne(`${API}/purchases`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush([]);
  });

  it('registerExpense manda el gasto por POST', () => {
    const input = { concept: 'Luz', category: 'Luz', area: 'general' as const, amount: 300, notes: 'Bimestre' };

    service.registerExpense(input).subscribe();

    const request = http.expectOne(`${API}/expenses`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush({});
  });

  it('quoteSale manda producto, unidad y cantidad como parámetros', () => {
    service.quoteSale('p-1', 'kg', 2.5).subscribe();

    const request = http.expectOne((req) => req.url === `${API}/sales/quote`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('productId')).toBe('p-1');
    expect(request.request.params.get('unit')).toBe('kg');
    expect(request.request.params.get('quantity')).toBe('2.5');
    request.flush({});
  });

  it('registerSaleBatch manda cliente, vendedor y líneas por POST', () => {
    const input = {
      customer: 'Publico general',
      sellerId: '0409',
      lines: [{ productId: 'p-1', unit: 'bag' as const, quantity: 1 }]
    };

    service.registerSaleBatch(input).subscribe();

    const request = http.expectOne(`${API}/sales/batch`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush({});
  });

  it('authorizeSeller manda el ID de vendedor por POST', () => {
    service.authorizeSeller('0409').subscribe();

    const request = http.expectOne(`${API}/sellers/authorize`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ sellerId: '0409' });
    request.flush({ authorized: true, seller: { id: '0409', name: 'Aurelio' } });
  });
});
