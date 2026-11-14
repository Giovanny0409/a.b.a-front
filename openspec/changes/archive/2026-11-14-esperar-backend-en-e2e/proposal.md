## Why

`playwright.config.ts` solo espera al front (`:4200`). Si hay un `ng serve` vivo sin backend en `:5028`,
Playwright lo reutiliza, nadie arranca el backend y la suite agota el tiempo esperando
`POST /api/purchases` (P-12). Pasó el 2026-11-14 con un `ng serve` que sobró de una corrida: la falla
parece de la app y no lo es.

## What Changes

- `webServer` pasa a dos entradas, cada una con su propia URL de espera y `reuseExistingServer`: el backend
  (`dotnet run --launch-profile http` en `../a.b.a-back`, o en `ABA_BACKEND_PATH`, esperando
  `http://localhost:5028/api/products`) y el front (`ng serve` en `127.0.0.1:4200`). Playwright arranca
  solo el que falte y espera a los dos.
- Deja de usar `npm start` (`scripts/start-with-backend.ps1`) para las pruebas: ese script deja el backend
  en una ventana oculta y solo lo arranca si no responde `/swagger`, y Playwright no lo veía.
- `e2e/README.md` y la skill `qa-playwright` describen el arranque nuevo.

## Capabilities

### New Capabilities
_(ninguna)_

### Modified Capabilities
- `e2e-qa`: la batería espera al backend además del front, y arranca el que falte.

## Impact

- Front (`a.b.a-front`): `playwright.config.ts`, `e2e/README.md`, `.claude/skills/qa-playwright/SKILL.md`,
  `docs/PENDIENTES.md`.
- Back: no se toca.
- Rama: `dev-fix-e2e-esperar-backend`, apilada sobre `dev-fix-venta-doble-en-lote` (P-06).
