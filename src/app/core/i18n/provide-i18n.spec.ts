import { CurrencyPipe } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { APP_LOCALE, provideI18n } from './provide-i18n';

describe('provideI18n', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideI18n()] }));

  it('usa el formato es-MX: los pesos se ven con «$» y no con «MX$»', () => {
    const locale = TestBed.inject(LOCALE_ID);
    const pipe = new CurrencyPipe(locale, 'MXN');

    expect(locale).toBe(APP_LOCALE);
    expect(pipe.transform(1250)).toBe('$1,250.00');
    expect(pipe.transform(0, 'MXN')).toBe('$0.00');
  });
});
