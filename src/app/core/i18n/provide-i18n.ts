import { registerLocaleData } from '@angular/common';
import localeEsMx from '@angular/common/locales/es-MX';
import { DEFAULT_CURRENCY_CODE, EnvironmentProviders, LOCALE_ID, Provider, makeEnvironmentProviders } from '@angular/core';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { EsJsonLoader } from './es-json.loader';

export const APP_LANGUAGE = 'es';
export const APP_LOCALE = 'es-MX';

/** Español como único idioma, con el formato regional es-MX para importes, números y fechas. */
export function provideI18n(): EnvironmentProviders {
  registerLocaleData(localeEsMx, APP_LOCALE);

  const providers: Provider[] = [
    provideTranslateService({
      lang: APP_LANGUAGE,
      fallbackLang: APP_LANGUAGE,
      loader: provideTranslateLoader(EsJsonLoader)
    }),
    { provide: LOCALE_ID, useValue: APP_LOCALE },
    { provide: DEFAULT_CURRENCY_CODE, useValue: 'MXN' }
  ];

  return makeEnvironmentProviders(providers);
}
