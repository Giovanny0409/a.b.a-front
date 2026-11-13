import { defineConfig, devices } from '@playwright/test';

const APP_URL = 'http://127.0.0.1:4200';

// Un escritorio real: debajo de 1280 px algunas pantallas cambian a su layout de móvil.
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

export default defineConfig({
  testDir: './e2e',
  // Un solo worker: todas las suites comparten el mismo backend y la misma aba.db, y dos suites
  // escribiendo inventario en paralelo se pisarían.
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: APP_URL,
    trace: 'retain-on-failure',
    viewport: DESKTOP_VIEWPORT
  },

  projects: [
    {
      name: 'chromium',
      // El spread trae su propio viewport (1280x720), así que se repite después.
      use: { ...devices['Desktop Chrome'], viewport: DESKTOP_VIEWPORT }
    }
  ],

  // npm start levanta el backend (:5028) y el front (:4200); si ya están arriba, se reutilizan.
  webServer: {
    command: 'npm start',
    url: APP_URL,
    reuseExistingServer: true,
    timeout: 180_000
  }
});
