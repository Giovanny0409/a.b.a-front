import { defineConfig, devices } from '@playwright/test';

const APP_URL = 'http://127.0.0.1:4200';
// Lo que la suite necesita del backend; /swagger respondería aunque la API no sirviera.
const API_URL = 'http://localhost:5028/api/products';
// Igual que scripts/start-with-backend.ps1: el repo hermano, o ABA_BACKEND_PATH.
const BACKEND_PATH = process.env['ABA_BACKEND_PATH'] ?? '../a.b.a-back';

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

  // Un servidor por entrada: Playwright reutiliza el que ya responda, arranca solo el que falte, espera a
  // los dos y al terminar cierra solo lo que arrancó.
  webServer: [
    {
      command: 'dotnet run --launch-profile http',
      cwd: BACKEND_PATH,
      url: API_URL,
      reuseExistingServer: true,
      timeout: 180_000
    },
    {
      command: 'npx ng serve --host 127.0.0.1 --port 4200',
      url: APP_URL,
      reuseExistingServer: true,
      timeout: 180_000
    }
  ]
});
