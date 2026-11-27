import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { StoreDevtools } from '@ngrx/store-devtools';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { Notifier, SwalNotifier } from '@core/notify/notification.service';
import { fakeNotifier } from '@testing/fake-notifier';
import { appConfig } from './app.config';

describe('appConfig', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('provee los avisos con SweetAlert2', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });

    expect(TestBed.inject(Notifier)).toBeInstanceOf(SwalNotifier);
  });

  it('registra el estado de los seis features', async () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });

    const state = await firstValueFrom(TestBed.inject(Store).select((root) => root));

    expect(Object.keys(state as object).sort())
      .toEqual(['appTopbar', 'dashboard', 'history', 'inventory', 'purchases', 'sales']);
  });

  it('no deja mutar el estado del store', async () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });

    const sales = await firstValueFrom(TestBed.inject(Store).select((root: { sales: { products: unknown[] } }) => root.sales));

    expect(() => sales.products.push({})).toThrow(TypeError);
  });

  // Las pruebas compilan con la configuración development (environment.development.ts). Que el build de
  // producción no las traiga se comprueba en el bundle (tarea 3.2 de adoptar-estructura-de-sadform).
  it('en desarrollo registra las Redux DevTools', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });

    expect(environment.production).toBe(false);
    expect(TestBed.inject(StoreDevtools)).toBeDefined();
  });

  it('las peticiones pasan por el aviso de sin conexión', () => {
    const notifier = fakeNotifier();
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, provideHttpClientTesting(), { provide: Notifier, useValue: notifier }]
    });
    const http = TestBed.inject(HttpClient);
    const backend = TestBed.inject(HttpTestingController);

    http.get('/api/products').subscribe({ error: () => undefined });
    backend.expectOne('/api/products').error(new ProgressEvent('error'), { status: 0 });

    expect(notifier.choice).toHaveBeenCalledTimes(1);
    backend.verify();
  });
});
