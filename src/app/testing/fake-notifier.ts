// Notifier falso para los *.spec.ts: cada método es un vi.fn() que resuelve en seguida. La prueba programa
// la respuesta de confirm, prompt o choice con mockResolvedValue(...).
import { Mock } from 'vitest';
import { Notifier } from '../core/notify/notification.service';

export type FakeNotifier = { [K in keyof Notifier]: Mock };

export function fakeNotifier(): FakeNotifier {
  return {
    success: vi.fn(() => Promise.resolve()),
    error: vi.fn(() => Promise.resolve()),
    confirm: vi.fn(() => Promise.resolve(false)),
    prompt: vi.fn(() => Promise.resolve(null)),
    choice: vi.fn(() => Promise.resolve('dismiss'))
  };
}
