import { TestBed } from '@angular/core/testing';
import { Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Observable, Subject, firstValueFrom, isObservable } from 'rxjs';
import { Action } from '@ngrx/store';
import { SalesActions } from '@features/sales/store/sales.actions';
import { FakeNotifier, fakeNotifier } from '@testing/fake-notifier';
import { t } from '@testing/translate';
import { provideI18n } from './i18n/provide-i18n';
import { Notifier } from './notify/notification.service';
import { selectActiveSeller } from '@features/sales/store/sales.selectors';
import { salesAuthorizationGuard } from './sales-auth.guard';

describe('salesAuthorizationGuard', () => {
  let store: MockStore;
  let actions$: Subject<Action>;
  let router: Router;
  let notifier: FakeNotifier;

  beforeEach(() => {
    actions$ = new Subject<Action>();
    notifier = fakeNotifier();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideMockStore(),
        provideMockActions(() => actions$),
        provideI18n(),
        { provide: Notifier, useValue: notifier }
      ]
    });
    store = TestBed.inject(MockStore);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    store.resetSelectors();
    vi.restoreAllMocks();
  });

  /** Espera a que el guard despache la autorización (el ID llega después del diálogo) y la devuelve. */
  async function authorizeRequest(dispatch: { mock: { calls: unknown[][] } }): Promise<{ requestId: string; sellerId: string }> {
    await vi.waitFor(() => expect(dispatch.mock.calls).toHaveLength(1));
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

    await expect(firstValueFrom(runGuard())).resolves.toBe(true);
    expect(notifier.prompt).not.toHaveBeenCalled();
  });

  it('pide el ID en el diálogo de la app, con el campo oculto', async () => {
    store.overrideSelector(selectActiveSeller, null);

    await firstValueFrom(runGuard());

    expect(notifier.prompt).toHaveBeenCalledWith({ title: t('seller.askId'), secret: true });
  });

  it('regresa al tablero si se cancela el diálogo', async () => {
    store.overrideSelector(selectActiveSeller, null);
    notifier.prompt.mockResolvedValue(null);
    const dispatch = vi.spyOn(store, 'dispatch');

    const result = await firstValueFrom(runGuard());

    expect(router.serializeUrl(result as UrlTree)).toBe('/tablero');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('pide autorización y deja pasar a un vendedor autorizado', async () => {
    store.overrideSelector(selectActiveSeller, null);
    notifier.prompt.mockResolvedValue('0409');
    const dispatch = vi.spyOn(store, 'dispatch');

    const result = firstValueFrom(runGuard());
    const { requestId, sellerId } = await authorizeRequest(dispatch);
    expect(sellerId).toBe('0409');

    actions$.next(SalesActions.authorizeSellerSuccess({
      requestId,
      authorization: { authorized: true, seller: { id: '0409', name: 'Aurelio' } }
    }));

    await expect(result).resolves.toBe(true);
  });

  it('ignora respuestas de otra solicitud', async () => {
    store.overrideSelector(selectActiveSeller, null);
    notifier.prompt.mockResolvedValue('0409');
    const dispatch = vi.spyOn(store, 'dispatch');

    const result = firstValueFrom(runGuard());
    const { requestId } = await authorizeRequest(dispatch);

    actions$.next(SalesActions.authorizeSellerFailure({ requestId: 'otra', error: 'x' }));
    actions$.next(SalesActions.authorizeSellerSuccess({
      requestId,
      authorization: { authorized: true, seller: { id: '0409', name: 'Aurelio' } }
    }));

    await expect(result).resolves.toBe(true);
  });

  it('regresa al tablero y avisa si el ID no está autorizado', async () => {
    store.overrideSelector(selectActiveSeller, null);
    notifier.prompt.mockResolvedValue('9999');
    const dispatch = vi.spyOn(store, 'dispatch');

    const result = firstValueFrom(runGuard());
    const { requestId } = await authorizeRequest(dispatch);
    actions$.next(SalesActions.authorizeSellerSuccess({
      requestId,
      authorization: { authorized: false, seller: null }
    }));

    expect(router.serializeUrl(await result as UrlTree)).toBe('/tablero');
    expect(notifier.error).toHaveBeenCalledWith(t('seller.rejected'));
  });

  it('regresa al tablero y avisa si falla la autorización', async () => {
    store.overrideSelector(selectActiveSeller, null);
    notifier.prompt.mockResolvedValue('0409');
    const dispatch = vi.spyOn(store, 'dispatch');

    const result = firstValueFrom(runGuard());
    const { requestId } = await authorizeRequest(dispatch);
    actions$.next(SalesActions.authorizeSellerFailure({ requestId, error: 'Sin red' }));

    expect(router.serializeUrl(await result as UrlTree)).toBe('/tablero');
    expect(notifier.error).toHaveBeenCalledWith(t('seller.rejected'));
  });
});
