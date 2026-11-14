import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, throwError } from 'rxjs';
import { Notifier } from './notification.service';

/**
 * Aviso de sin conexión. Se muestra una sola vez aunque fallen varias peticiones a la vez: mientras está
 * abierto, las demás fallas no abren otro.
 */
@Injectable({ providedIn: 'root' })
export class ConnectionNotice {
  private readonly notifier = inject(Notifier);
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);
  private open = false;

  async warn(): Promise<void> {
    if (this.open) {
      return;
    }

    this.open = true;
    const choice = await this.notifier.choice({
      icon: 'error',
      title: this.translate.instant('notifications.connection.title'),
      text: this.translate.instant('notifications.connection.text'),
      confirm: this.translate.instant('notifications.actions.retry')
    });
    this.open = false;

    if (choice === 'confirm') {
      this.reload();
    }
  }

  reload(): void {
    this.document.location.reload();
  }
}

/** Avisa cuando el backend no responde (`status === 0`). El error sigue su camino a quien hizo la petición. */
export const connectionInterceptor: HttpInterceptorFn = (request, next) => {
  const notice = inject(ConnectionNotice);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 0) {
        void notice.warn();
      }
      return throwError(() => error);
    })
  );
};
