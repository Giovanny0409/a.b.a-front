import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { provideI18n } from '@core/i18n/provide-i18n';
import { t } from './translate';

describe('t (textos de es.json para las pruebas)', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideI18n()] }));

  it('da el mismo texto que ngx-translate', () => {
    expect(t('menu.history')).toBe(TestBed.inject(TranslateService).instant('menu.history'));
  });

  it('falla si la clave no existe, para que una prueba no compare contra la clave', () => {
    expect(() => t('menu.noExiste')).toThrow('menu.noExiste');
  });
});
