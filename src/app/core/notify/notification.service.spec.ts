import { TestBed } from '@angular/core/testing';
import Swal, { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';
import { t } from '@testing/translate';
import { provideI18n } from '../i18n/provide-i18n';
import { SUCCESS_TIMER_MS, SwalNotifier } from './notification.service';

describe('SwalNotifier', () => {
  let notifier: SwalNotifier;
  let fire: ReturnType<typeof vi.fn>;

  function answer(result: Partial<SweetAlertResult>): void {
    fire.mockResolvedValue({ isConfirmed: false, isDenied: false, isDismissed: false, ...result });
  }

  function options(): SweetAlertOptions {
    return fire.mock.calls[0][0] as SweetAlertOptions;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideI18n(), SwalNotifier] });
    notifier = TestBed.inject(SwalNotifier);
    fire = vi.fn();
    vi.spyOn(Swal, 'fire').mockImplementation(fire as unknown as typeof Swal.fire);
    answer({ isDismissed: true });
  });

  afterEach(() => vi.restoreAllMocks());

  it('un éxito se cierra solo y no tiene botón', async () => {
    await notifier.success('Compra registrada');

    expect(options()).toMatchObject({
      icon: 'success',
      title: 'Compra registrada',
      timer: SUCCESS_TIMER_MS,
      showConfirmButton: false
    });
  });

  it('un error se queda hasta cerrarlo con «Cerrar»', async () => {
    await notifier.error('El producto Comedero es de piezas.');

    expect(options()).toMatchObject({
      icon: 'error',
      text: 'El producto Comedero es de piezas.',
      confirmButtonText: t('notifications.actions.close')
    });
    expect(options().timer).toBeUndefined();
  });

  it('usa los botones de la app y no los estilos de SweetAlert2', async () => {
    await notifier.success('Listo');

    expect(options()).toMatchObject({
      buttonsStyling: false,
      customClass: { popup: 'aba-notification', confirmButton: 'btn', denyButton: 'btn secondary', cancelButton: 'btn secondary' }
    });
  });

  it('confirmar devuelve si la persona aceptó, con «Cancelar» por omisión', async () => {
    answer({ isConfirmed: true });
    await expect(notifier.confirm({ title: '¿Eliminar?', confirm: 'Eliminar' })).resolves.toBe(true);
    expect(options()).toMatchObject({
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: t('notifications.actions.cancel')
    });

    answer({ isDismissed: true });
    await expect(notifier.confirm({ title: '¿Eliminar?', confirm: 'Eliminar' })).resolves.toBe(false);
  });

  it('pedir un dato secreto usa un campo de contraseña y devuelve lo escrito o null', async () => {
    answer({ isConfirmed: true, value: '0409' });
    await expect(notifier.prompt({ title: 'ID', secret: true })).resolves.toBe('0409');
    expect(options()).toMatchObject({
      input: 'password',
      confirmButtonText: t('notifications.actions.accept'),
      cancelButtonText: t('notifications.actions.cancel')
    });

    answer({ isDismissed: true });
    await expect(notifier.prompt({ title: 'ID', secret: true })).resolves.toBeNull();
  });

  it('elegir devuelve el botón elegido o «dismiss» si se cierra sin elegir', async () => {
    const choice = { title: 'Venta cobrada', confirm: 'Ver ticket', deny: 'Nueva venta' };

    answer({ isConfirmed: true });
    await expect(notifier.choice(choice)).resolves.toBe('confirm');
    expect(options()).toMatchObject({ showDenyButton: true, confirmButtonText: 'Ver ticket', denyButtonText: 'Nueva venta' });

    answer({ isDenied: true });
    await expect(notifier.choice(choice)).resolves.toBe('deny');

    answer({ isDismissed: true });
    await expect(notifier.choice(choice)).resolves.toBe('dismiss');
  });

  it('sin segunda opción solo muestra el botón principal', async () => {
    await notifier.choice({ title: 'Sin conexión', confirm: 'Reintentar' });

    expect(options().showDenyButton).toBe(false);
  });
});
