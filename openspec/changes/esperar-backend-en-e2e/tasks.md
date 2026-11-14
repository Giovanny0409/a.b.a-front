## 1. Registros

- [x] 1.1 En `docs/PENDIENTES.md`, pasar P-12 a «En curso» con este change, en el mismo commit que los artefactos.

## 2. Corrección

- [ ] 2.1 En `playwright.config.ts`, reemplazar el `webServer` único por el arreglo de D1 (backend y front).
- [ ] 2.2 Probar los tres escenarios de `specs/e2e-qa/spec.md`: front vivo sin backend, backend vivo sin front, y nada corriendo (al terminar no queda nada escuchando).

## 3. Documentación

- [ ] 3.1 `e2e/README.md` («Cómo correr») y `.claude/skills/qa-playwright/SKILL.md`: el arranque de los dos servidores y que, si se cambió el back, se detenga el backend que esté corriendo antes de la batería.

## 4. Verificación y cierre

- [ ] 4.1 `npx tsc -p e2e/tsconfig.json`, `npm test` y `npm run build`.
- [ ] 4.2 `openspec validate esperar-backend-en-e2e --strict`.
- [ ] 4.3 En `docs/PENDIENTES.md`, cerrar P-12 con su evidencia.
