import { Injectable } from '@angular/core';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import es from '../../../assets/i18n/es.json';

/**
 * Entrega el diccionario en español desde el bundle, sin petición HTTP: los textos existen desde el
 * primer render y `TranslateService.instant()` funciona sin esperar la carga.
 */
@Injectable()
export class EsJsonLoader implements TranslateLoader {
  getTranslation(): Observable<TranslationObject> {
    return of(es);
  }
}
