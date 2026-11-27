import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import es from '../../../assets/i18n/es.json';
import { t } from '@testing/translate';
import { EsJsonLoader } from './es-json.loader';
import { provideI18n } from './provide-i18n';

describe('EsJsonLoader', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideI18n()] }));

  it('entrega el diccionario en español del bundle', async () => {
    expect(await firstValueFrom(new EsJsonLoader().getTranslation())).toBe(es);
  });

  it('deja los textos listos al arrancar, sin esperar una carga', () => {
    const translate = TestBed.inject(TranslateService);

    expect(translate.instant('menu.dashboard')).toBe(t('menu.dashboard'));
  });

  it('devuelve tal cual un texto que no es una clave, como los mensajes del backend', () => {
    const translate = TestBed.inject(TranslateService);

    expect(translate.instant('No hay inventario suficiente para esta venta.'))
      .toBe('No hay inventario suficiente para esta venta.');
  });
});
