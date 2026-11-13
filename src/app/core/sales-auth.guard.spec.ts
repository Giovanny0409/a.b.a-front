import { TestBed } from '@angular/core/testing';
import { Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable, Subject, firstValueFrom, isObservable } from 'rxjs';
import { Action } from '@ngrx/store';
import { SalesActions } from '../features/sales/store/sales.actions';
import { selectActiveSeller } from '../features/sales/store/sales.selectors';
import { salesAuthorizationGuard } from './sales-auth.guard';

describe('salesAuthorizationGuard', () => {
  let store: MockStore;
  let actions$: Subject<Action>;
  let router: Router;

  beforeEach(() => {
    actions$ = new Subject<Action>();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideMockStore(),
        provideMockActions(() => actions$)
      ]
    });
    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    store.resetSelectors();
    vi.restoreAllMocks();
  });

  function authorizeRequest(dispatch: { mock: { calls: unknown[][] } }): { requestId: string; sellerId: string } {
    return dispatch.mock.calls[0][0] as ReturnType<typeof SalesActions.authorizeSeller>;
  }

  function runGuard(): Observable<boolean | UrlTree> {
    const result = TestBed.runInInjectionContext(() =>
      salesAuthorizationGuard({} as Route, [] as UrlSegment[])
    );
    if (!isObservable(result)) {
      throw new Error('El guard debe devolver un Observable');
    }
    return result as Observable<boolean | UrlTree>;
  }

  it('deja pasar si ya hay un vendedor activo, sin preguntar', async () => {
    store.overrideSelector(selectActiveSeller, { id: '0409', name: 'Aurelio' });
    const prompt = vi.spyOn(window, 'prompt');

    await expect(firstValueFrom(runGuard())).resolves.toBe(true);
    expect(prompt).not.toHaveBeenCalled();
  });

  it('regresa al tablero si se cancela el prompt', async () => {
    store.overrideSelector(selectActiveSeller, null);
    vi.spyOn(window, 'prompt').mockReturnValue(null);

    const result = await firstValueFrom(runGuard());

    expect(router.serializeUrl(result as UrlTree)).toBe('/tablero');
  });

  it('pide autorización y deja pasar a un vendedor autorizado', async () => {
    store.overrideSelector(selectActiveSeller, null);
    vi.spyOn(window, 'prompt').mockReturnValue('0409');
    const dispatch = vi.spyOn(store, 'dispatch');

    const result = firstValueFrom(runGuard());
    const { requestId, sellerId } = authorizeRequest(dispatch);
    expect(sellerId).toBe('0409');

    actions$.next(SalesActions.authorizeSellerSuccess({
      requestId,
      authorization: { authorized: true, seller: { id: '0409', name: 'Aurelio' } }
    }));

    await expect(result).resolves.toBe(true);
  });

  it('ignora respuestas de otra solicitud', async () => {
    store.overrideSelector(selectActiveSeller, null);
    vi.spyOn(window, 'prompt').mockReturnValue('0409');
    const dispatch = vi.spyOn(store, 'dispatch');

    const result = firstValueFrom(runGuard());
    const { requestId } = authorizeRequest(dispatch);

    actions$.next(SalesActions.authorizeSellerFailure({ requestId: 'otra', error: 'x' }));
    actions$.next(SalesActions.authorizeSellerSuccess({
      requestId,
      authorization: { authorized: true, seller: { id: '0409', name: 'Aurelio' } }
    }));

    await expect(result).resolves.toBe(true);
  });

  it('regresa al tablero y avisa si el ID no está autorizado', async () => {
    store.overrideSelector(selectActiveSeller, null);
    vi.spyOn(window, 'prompt').mockReturnValue('9999');
    const dispatch = vi.spyOn(store, 'dispatch');

    const result = firstValueFrom(runGuard());
    const { requestId } = authorizeRequest(dispatch);
    actions$.next(SalesActions.authorizeSellerSuccess({
      requestId,
      authorization: { authorized: false, seller: null }
    }));

    expect(router.serializeUrl(await result as UrlTree)).toBe('/tablero');
    expect(window.alert).toHaveBeenCalledWith('ID de vendedor no autorizado.');
  });

  it('regresa al tablero y avisa si falla la autorización', async () => {
    store.overrideSelector(selectActiveSeller, null);
    vi.spyOn(window, 'prompt').mockReturnValue('0409');
    const dispatch = vi.spyOn(store, 'dispatch');

    const result = firstValueFrom(runGuard());
    const { requestId } = authorizeRequest(dispatch);
    actions$.next(SalesActions.authorizeSellerFailure({ requestId, error: 'Sin red' }));

    expect(router.serializeUrl(await result as UrlTree)).toBe('/tablero');
    expect(window.alert).toHaveBeenCalledWith('ID de vendedor no autorizado.');
  });
});
