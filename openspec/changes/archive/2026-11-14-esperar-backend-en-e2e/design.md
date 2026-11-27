## Context

`playwright.config.ts` declara un solo `webServer` con `command: 'npm start'` y `url` del front. `npm start`
corre `scripts/start-with-backend.ps1`, que arranca el backend con `Start-Process` oculto solo si
`/swagger` no responde, espera 4 s y arranca `ng serve`. Playwright solo comprueba `:4200`: con un front
vivo, lo da por bueno sin mirar el backend.

## Goals / Non-Goals

**Goals:** que la batería no corra nunca con uno de los dos servidores caído, y que levante solo lo que
falte.

**Non-Goals:** cambiar `npm start` ni el script de arranque para el uso diario; aislar la base de las
pruebas (P-08).

## Decisions

**D1. Dos `webServer`, uno por servidor.** Playwright acepta un arreglo; arranca en paralelo los que no
respondan y espera a todos. Backend: `command: 'dotnet run --launch-profile http'`, `cwd` =
`process.env.ABA_BACKEND_PATH ?? '../a.b.a-back'` (igual que el script de arranque),
`url: 'http://localhost:5028/api/products'`. Front: `command: 'npx ng serve --host 127.0.0.1 --port 4200'`,
`url: 'http://127.0.0.1:4200'`. Los dos con `reuseExistingServer: true` y `timeout: 180_000`. Se espera
`/api/products` y no `/swagger` porque es lo que de verdad necesita la suite.

**D2. Sin el script de PowerShell en las pruebas.** El backend que arranca el script queda fuera del árbol
de procesos de Playwright; con `dotnet run` directo, Playwright lo cierra al terminar.

## Risks / Trade-offs

- [El primer `dotnet run` compila el backend] → `timeout` de 180 s, igual que antes.
- [Un backend viejo ya corriendo con código de otra rama] → se reutiliza, igual que antes con el front;
  la skill dice que, si se cambió el back, se detenga antes de correr la batería.
