import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { t } from '../../testing/translate';
import { provideI18n } from '../i18n/provide-i18n';
import { ConnectionNotice, connectionInterceptor } from './connection.interceptor';
import { Choice, Notifier } from './notification.service';

describe('connectionInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let notice: ConnectionNotice;
  let notifier: { choice: ReturnType<typeof vi.fn> };
  let close: (choice: Choice) => void;

  beforeEach(() => {
    notifier = {
      choice: vi.fn(() => new Promise<Choice>((resolve) => (close = resolve)))
    };
    TestBed.configureTestingModule({
      providers: [
        provideI18n(),
        provideHttpClient(withInterceptors([connectionInterceptor])),
        provideHttpClientTesting(),
        { provide: Notifier, useValue: notifier }
      ]
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    notice = TestBed.inject(ConnectionNotice);
    vi.spyOn(notice, 'reload').mockImplementation(() => undefined);
  });

  afterEach(() => backend.verify());

  /** Hace una petición que falla como si el servidor no respondiera, y devuelve el error que recibió. */
  function failWithoutServer(url: string): { error?: unknown } {
    const received: { error?: unknown } = {};
    http.get(url).subscribe({ error: (error) => (received.error = error) });
    backend.expectOne(url).error(new ProgressEvent('error'), { status: 0 });
    return received;
  }

  it('avisa sin conexión con «Reintentar» y deja seguir el error', () => {
    const received = failWithoutServer('/api/products');

    expect(notifier.choice).toHaveBeenCalledWith({
      icon: 'error',
      title: t('notifications.connection.title'),
      text: t('notifications.connection.text'),
      confirm: t('notifications.actions.retry')
    });
    expect(received.error).toBeDefined();
  });

  it('avisa una sola vez aunque fallen varias peticiones a la vez', () => {
    for (const url of ['/a', '/b', '/c', '/d', '/e']) {
      failWithoutServer(url);
    }

    expect(notifier.choice).toHaveBeenCalledTimes(1);
  });

  it('«Reintentar» recarga la pantalla', async () => {
    failWithoutServer('/api/products');

    close('confirm');
    await vi.waitFor(() => expect(notice.reload).toHaveBeenCalled());
  });

  it('al cerrar el aviso, una nueva falla vuelve a avisar', async () => {
    failWithoutServer('/a');
    close('dismiss');
    await new Promise((resolve) => setTimeout(resolve));

    failWithoutServer('/b');

    expect(notifier.choice).toHaveBeenCalledTimes(2);
    expect(notice.reload).not.toHaveBeenCalled();
  });

  it('no avisa por un error con respuesta del servidor', () => {
    const received: { error?: unknown } = {};
    http.get('/api/sales/quote').subscribe({ error: (error) => (received.error = error) });
    backend.expectOne('/api/sales/quote').flush({ message: 'No hay inventario suficiente.' }, { status: 404, statusText: 'Not Found' });

    expect(notifier.choice).not.toHaveBeenCalled();
    expect(received.error).toBeDefined();
  });
});
