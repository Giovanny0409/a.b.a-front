import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import Swal, { SweetAlertOptions } from 'sweetalert2';

export type NotifierIcon = 'success' | 'error' | 'warning' | 'question';

export interface ConfirmOptions {
  title: string;
  /** Texto del botón que confirma. */
  confirm: string;
  /** Texto del botón que cancela; por omisión, «Cancelar». */
  cancel?: string;
}

export interface PromptOptions {
  title: string;
  /** Oculta lo que se escribe, como un campo de contraseña. */
  secret?: boolean;
}

export interface ChoiceOptions {
  title: string;
  text?: string;
  icon?: NotifierIcon;
  confirm: string;
  /** Segunda opción; sin ella, el aviso solo ofrece `confirm`. */
  deny?: string;
}

/** Lo que eligió la persona: el botón principal, el segundo o cerrar el aviso sin elegir. */
export type Choice = 'confirm' | 'deny' | 'dismiss';

/**
 * Avisos y diálogos de la app. Los componentes y el guard dependen de esta abstracción; las pruebas la
 * sustituyen con un doble. Los textos llegan ya traducidos, salvo los botones genéricos.
 */
export abstract class Notifier {
  /** Éxito: se cierra solo. */
  abstract success(text: string): Promise<void>;
  /** Error: se queda hasta que la persona lo cierra. */
  abstract error(text: string): Promise<void>;
  /** `true` si la persona confirma. */
  abstract confirm(options: ConfirmOptions): Promise<boolean>;
  /** Lo que escribió la persona, o `null` si canceló. */
  abstract prompt(options: PromptOptions): Promise<string | null>;
  abstract choice(options: ChoiceOptions): Promise<Choice>;
}

/** Tiempo que se ve un aviso de éxito antes de cerrarse solo. */
export const SUCCESS_TIMER_MS = 2500;

/** `Notifier` sobre SweetAlert2, con los botones de `_buttons.scss` y los colores de `_notifications.scss`. */
@Injectable()
export class SwalNotifier extends Notifier {
  private readonly translate = inject(TranslateService);

  async success(text: string): Promise<void> {
    await Swal.fire({
      ...this.base(),
      icon: 'success',
      title: text,
      timer: SUCCESS_TIMER_MS,
      showConfirmButton: false
    });
  }

  async error(text: string): Promise<void> {
    await Swal.fire({
      ...this.base(),
      icon: 'error',
      text,
      confirmButtonText: this.translate.instant('notifications.actions.close')
    });
  }

  async confirm(options: ConfirmOptions): Promise<boolean> {
    const result = await Swal.fire({
      ...this.base(),
      icon: 'warning',
      title: options.title,
      showCancelButton: true,
      confirmButtonText: options.confirm,
      cancelButtonText: options.cancel ?? this.translate.instant('notifications.actions.cancel')
    });
    return result.isConfirmed;
  }

  async prompt(options: PromptOptions): Promise<string | null> {
    const result = await Swal.fire({
      ...this.base(),
      title: options.title,
      input: options.secret ? 'password' : 'text',
      inputAttributes: { autocomplete: 'off' },
      showCancelButton: true,
      confirmButtonText: this.translate.instant('notifications.actions.accept'),
      cancelButtonText: this.translate.instant('notifications.actions.cancel')
    });
    return result.isConfirmed ? String(result.value ?? '') : null;
  }

  async choice(options: ChoiceOptions): Promise<Choice> {
    const result = await Swal.fire({
      ...this.base(),
      icon: options.icon,
      title: options.title,
      text: options.text,
      confirmButtonText: options.confirm,
      showDenyButton: Boolean(options.deny),
      denyButtonText: options.deny
    });
    if (result.isConfirmed) {
      return 'confirm';
    }
    return result.isDenied ? 'deny' : 'dismiss';
  }

  private base(): Pick<SweetAlertOptions, 'buttonsStyling' | 'customClass'> {
    return {
      buttonsStyling: false,
      customClass: {
        popup: 'aba-notification',
        confirmButton: 'btn',
        denyButton: 'btn secondary',
        cancelButton: 'btn secondary'
      }
    };
  }
}
