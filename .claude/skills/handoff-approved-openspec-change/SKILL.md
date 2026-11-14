---
name: handoff-approved-openspec-change
description: Prepara un change de OpenSpec ya aprobado para implementarlo en una conversación nueva. Úsala después de aprobar una propuesta cuando convenga renovar el contexto. Registra la aprobación, se pone en la rama correcta (en front y, si el change lo toca, en back), deja en el propio change un resumen listo para aplicar (handoff.md) y entrega un prompt para copiar y pegar que lo carga y corre /opsx:apply.
license: MIT
compatibility: Requiere el CLI de openspec y git.
metadata:
  version: "1.0"
---

Prepara un change **aprobado** para implementarlo limpio en una conversación nueva, con el backend en el
repo hermano `../a.b.a-back`. El resumen vive **en el propio change** (`handoff.md`), no en la memoria del agente: lo
del proyecto va al repositorio (D-03 en `docs/PENDIENTES.md`).

**Esta skill no escribe código de implementación.** Solo prepara el relevo. El trabajo ocurre en la
conversación nueva, con `/opsx:apply`.

**Entrada**: el nombre de un change aprobado (kebab-case). Si falta, dedúcelo de la conversación; si es
ambiguo, lista los changes activos (`openspec list --json`) y pregunta.

## Pasos

### 1. Rama primero

```bash
git branch --show-current
```

- Si ya estás en la rama del change, sigue. La rama no se llama como el change: búscala en el
  `proposal.md` (sección Impact → Rama) o pregúntala.
- Si no, crea la rama desde `dev` actualizado: `git fetch -q origin && git checkout -b
  dev-<tipo>-<descripcion> origin/dev`. El `<tipo>` sale de la naturaleza del change (`feat`, `fix`,
  `chore`, `refactor`, `docs`…).
- Si el `design.md` dice que el change toca el backend, crea la rama con **el mismo nombre** en
  `../a.b.a-back`, también desde su `origin/dev`.

Nunca empieces un change en la rama de otro.

### 2. Registrar la aprobación

En `openspec/changes/<change>/proposal.md`, agrega o actualiza al final:

```markdown
## Status

Aprobada — <AAAA-MM-DD>. Lista para implementar (rama + `/opsx:apply`).
```

### 3. Dejar el resumen listo para aplicar

Crea `openspec/changes/<change>/handoff.md`. Es el contrato de la conversación nueva, que no debe tener
que volver a explorar el código:

- **Estado**: aprobada, fecha, «sin empezar» o en qué tarea va.
- **Por qué**: de 2 a 5 líneas.
- **Qué se construye y dónde**: archivos y símbolos exactos, separados por repo (front / back).
- **Contrato**: si toca el backend, la forma exacta del JSON (nombres en camelCase de .NET) y el
  controlador, record, entidad y migración de EF Core.
- **Decisiones y trampas**: lo no obvio que se verificó explorando.
- **Compuertas**: `npm run build` (incluye `logs:check`), `npm test`, `dotnet build` si se toca el back,
  `openspec validate <change> --strict` y `docs/PENDIENTES.md`.
- **Rama y flujo**: la rama en cada repo, `/opsx:apply`, `/opsx:archive` antes del PR.
- **Fuera de alcance.**

Commitea la aprobación y el `handoff.md` juntos en la rama del change.

### 4. Entregar el prompt para copiar y pegar

Un solo bloque `text`:

```text
Lee openspec/changes/<change>/handoff.md y úsalo como contexto. Es un change de OpenSpec ya APROBADO.

Antes de tocar código, valida que estás en la rama <rama> (en a.b.a-front y, si aplica, en a.b.a-back);
si no, cámbiate a ella.

Luego aplica con /opsx:apply sobre openspec/changes/<change>/, respetando las compuertas de handoff.md:
npm run build, npm test, dotnet build si se toca el back, openspec validate --strict y
docs/PENDIENTES.md. Archiva antes de abrir el PR.

Fuera de alcance: <lista>.
```

### 5. Resumir y parar

Confirma el estado de la rama, que la propuesta quedó aprobada y la ruta del `handoff.md`, y entrega el
bloque. Aquí se detiene: la implementación es en la conversación nueva.

## Reglas

- Esta skill nunca escribe código de implementación.
- El paso 1 (rama) va siempre primero.
- La aprobación (paso 2) se registra antes del resumen, porque el resumen afirma que el change está
  aprobado.
- Respeta `CLAUDE.md`: compuertas, registros en `docs/PENDIENTES.md` y archivar antes del PR.
