## ADDED Requirements

### Requirement: La batería E2E espera al front y al backend
La batería SHALL comprobar por separado que respondan el front (`http://127.0.0.1:4200`) y el backend
(`http://localhost:5028/api/products`) antes de correr las suites. SHALL reutilizar el que ya responda y
arrancar solo el que falte (`ng serve` para el front, `dotnet run` en el repo del backend), y al terminar
SHALL cerrar solo lo que arrancó.

#### Scenario: Front vivo sin backend
- **WHEN** responde `:4200` pero no `:5028` y se ejecuta `npm run test:e2e`
- **THEN** Playwright reutiliza el front, arranca el backend, espera a que responda y las suites corren contra los dos

#### Scenario: Backend vivo sin front
- **WHEN** responde `:5028` pero no `:4200` y se ejecuta `npm run test:e2e`
- **THEN** Playwright reutiliza el backend, arranca `ng serve` y las suites corren contra los dos

#### Scenario: Nada corriendo
- **WHEN** no responde ninguno de los dos y se ejecuta `npm run test:e2e`
- **THEN** Playwright arranca los dos, corre las suites y al terminar no queda ninguno escuchando
