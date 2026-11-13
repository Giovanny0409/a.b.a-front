# Pendientes

Todo lo identificado en ABA Punto de Venta (front y back) y **no cerrado**: tareas, decisiones y deuda.
**Se lee antes de empezar a trabajar** y se actualiza en el mismo commit que el cambio que lo motiva.
Lo que aparece y no es del change en curso **se registra aquí y no se corrige ahí**: ampliar el alcance
es una decisión que se pregunta.

Vive solo en este repo (`a.b.a-front`), igual que la planeación de OpenSpec, aunque el registro sea del
backend: la columna **Repo** lo dice.

- **Prefijos:** `P-NN` pendientes, `D-NN` decisiones, `DT-NN` deuda técnica. Un ID nunca se reutiliza.
- **Estado:** Abierto · En curso · Bloqueado (motivo) · Cerrado (fecha y evidencia). Al cerrarse, la
  fila queda con un estado corto y la evidencia pasa a «Cerrados».

## 1. Pendientes

| ID | Pendiente | Origen | Repo | Estado |
|---|---|---|---|---|
| P-01 | La internacionalización no existe: `ngx-translate` no está en `package.json` y no hay `src/assets/i18n/es.json`, aunque el principio 1 de `CLAUDE.md` la exige. Ningún texto se puede llevar a claves hasta instalarla. Hace falta un change que instale `ngx-translate`, cree `es.json` y migre la primera pantalla; después conviene un `i18n:check` como el de `logs:check` | Revisión de la configuración, 2026-11-12 | front | Abierto |
| P-02 | Los datos de la laptop anterior no están en esta: `aba.db` se creó nueva el 2026-11-12 con los 3 productos de demostración de `PosStore.Seed`. Si había ventas, compras o inventario reales, se recuperan copiando el `aba.db` del disco viejo a `../a.b.a-back/` con el backend detenido | Instalación en la laptop nueva, 2026-11-12 | back | Abierto |
| P-03 | En `a.b.a-front`, `origin/HEAD` apunta a `primera-subida`, y existen además `main` y `dev`. `CLAUDE.md` dice que la rama estable es `main`. En `a.b.a-back`, `origin/HEAD` es `main`. Falta decidir si `primera-subida` se retira y cambiar la rama por omisión en GitHub | Revisión de ramas, 2026-11-12 | front | Abierto |
| P-04 | El `CLAUDE.md` del back dice que la planeación OpenSpec vive solo en el front y que no se duplica un `openspec/` en el back, pero el back tiene `openspec/config.yaml` y las skills de OpenSpec en `.claude/skills/`. Falta decidir si se borran del back o si el back planea sus propios changes | Revisión de la configuración, 2026-11-12 | back | Abierto |
| P-05 | `npm ci` reporta 52 vulnerabilidades en dependencias del front (2 bajas, 21 moderadas, 26 altas, 3 críticas). No se corrió `npm audit fix` porque puede cambiar versiones | Instalación en la laptop nueva, 2026-11-12 | front | Abierto |
| P-06 | `dev-feat-backend-sync` no se ha fusionado a `dev` en ninguno de los dos repos (front: 2 commits adelante; back: 1). `dev-chore-forma-de-trabajo` está apilada encima, así que su PR a `dev` incluye esos commits si va primero | Creación de `dev-chore-forma-de-trabajo`, 2026-11-12 | ambos | Abierto |
| P-07 | No hay pruebas E2E. Falta un change que instale Playwright, aísle sus datos de la base real (`aba.db`) y deje una suite piloto y la skill `qa-playwright` | D-05, 2026-11-12 | ambos | Abierto |

## 2. Decisiones

| ID | Decisión | Fecha |
|---|---|---|
| D-01 | Forma de trabajo: este registro, las reglas de OpenSpec en `openspec/config.yaml`, `logs:check` antes de compilar y probar, y la skill `handoff-approved-openspec-change` | 2026-11-12 |
| D-02 | Claude crea las ramas y hace los commits; antes de hacer push o abrir un PR (con `gh`) pregunta | 2026-11-12 |
| D-03 | La memoria del agente es solo para hechos de la máquina. Lo que es del proyecto va al repositorio, para que sobreviva a un cambio de laptop | 2026-11-12 |
| D-04 | Todo se maneja desde Git y GitHub: no hay publicación en la nube ni ambientes de test/prod. No se adoptan `CHANGELOG.md` ni la versión servida en `/version.json` | 2026-11-12 |
| D-05 | Los cambios que tocan pantallas se prueban en la app con Playwright antes del PR (ver P-07) | 2026-11-12 |

## 3. Deuda técnica

Sin registros.

## 4. Cerrados

Sin registros.
