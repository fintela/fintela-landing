---
description: Analizar a fondo la rama actual y proponer follow-ups concretos, en-alcance y bien razonados (qué es, por qué aporta valor en el contexto de la rama, acción sugerida puntual). Read-only: propone, no implementa. Calidad sobre cantidad.
argument-hint: "[base-branch] (default: main)"
allowed-tools: Bash(git:*), Read, Grep, Glob
---

Estás **analizando la rama git actual** para proponer follow-ups. Rama base: **$1** (si está vacío, usa `main`).

**Este comando es read-only: propone, NO implementa.** No commitees, no edites, no shipees nada. Tu única
salida es **UN reporte en español** (secciones de abajo, EN ORDEN).

Tres comandos hermanos, tres preguntas distintas — fijá tu lane antes de empezar:
- **`/code-review`** → «¿está bien lo que se escribió?» (bugs en el diff)
- **`/finish-branch`** → «¿cómo lo shipeo?» (propagación a landing/Fintelligent + collision-check + deploy)
- **`/follow-ups`** (este) → «¿qué es lo siguiente, **pequeño y alineado**, que esta rama dejó natural de hacer?»

Lo que NO te compete (derivá al hermano y seguí): bugs de lo ya escrito → `/code-review`; pulir/simplificar lo
ya escrito → `/simplify`; propagación/deploy/IAM/secretos/collision → `/finish-branch`; vulnerabilidades →
`/security-review`; ejecutar o verificar la app → `/verify`.

**Principio rector: disciplina de alcance + calidad sobre cantidad.** Un solo follow-up bien razonado vale más
que una lista larga de observaciones vagas. *Cuestioná cada candidato, no lo asumas; ante la duda, descártalo.*

## Hechos de Fintela (NO los re-derives — son la fuente de verdad)
Tratalos como ground-truth; doblan como checklist de las **lentes específicas** del Step 2.
- **DataCluster es taxonomía dual.** DB (`developers.cluster_type`) y todos los enums backend/Pydantic/TS
  persisten exactamente `us_equity | crypto | generalized`. El frontend renderiza 4 valores de presentación
  (`AssetClass`, incl. `forex | mixed`) en `frontend/src/domains/dataClusters/assetClassRegistry.ts`;
  `forex`/`mixed` mapean a `generalized` antes de persistir y **nunca** cruzan el wire. Nunca se agregan a
  `ClusterType` — se extiende el registry.
- **`.sqlx/` es cache offline generado.** Cambiar una `sqlx::query!`/`query_as!` sin re-`cargo sqlx prepare`
  rompe el build offline de todos. Nunca se hand-edita.
- **Migraciones pareadas** `migrations/<ts>_<name>.up.sql` + `.down.sql`; todo `up` necesita un `down` que lo
  revierta limpiamente (nunca un down huérfano o no-op cuando el up no es trivial).
- **i18n triple-locale `en/es/pt`** (app frontend y landing). Una key faltante renderiza el path literal de la
  key (se ve roto pero no crashea → falla silenciosa). Toda key nueva se replica con la **misma estructura** en
  las 3 locales. Glosario: `frontend/src/i18n/GLOSSARY.md`.
- **God-nodes (alto blast-radius):** `PortfolioService`, `TrackingService`, `StudyService`, `Panel`,
  `TimeSeries`, `Task`, `Configuration`. **Hyperedges** = features multi-archivo que deben cambiar juntas.
  Mapa estructural en `graphify-out/graph-index.md` (léelo para ubicar cluster y consumidores hermanos).
- **Dispatchers / on-demand workers:** riesgo de **doble-lanzamiento** del mismo batch PENDING y de no
  clasificar fallos transitorios (retry) vs permanentes (fail).
- **Ethos snapshot-everything:** parámetros/config de study/portfolio/trial se snapshotean para que los reruns
  sean reproducibles; un parámetro nuevo sin snapshot rompe la reproducibilidad.

---

## Step 1 — Reconstruir la intención y el alcance de la rama
Antes de proponer nada, entendé con precisión **qué se propuso esta rama y dónde traza su frontera.** Todo
follow-up se mide contra esto.

1. **Contexto git:** `git fetch origin <base>`; `git branch --show-current`; merge-base
   `git merge-base origin/<base> HEAD`; divergencia `git rev-list --left-right --count origin/<base>...HEAD`
   (izq = base adelante, der = rama adelante); `git status --porcelain`.
2. **Narrativa declarada:** `git log origin/<base>..HEAD` (mensajes de commit — la intención que el autor *dijo*).
3. **Forma del cambio:** `git diff --stat origin/<base>...HEAD`, luego **`git diff origin/<base>...HEAD` completo
   — léelo, no lo escanees.** El diff es la verdad; los mensajes de commit son la intención declarada.
4. **Sistema alrededor:** leé los archivos modificados clave **en su forma final** (no solo el hunk) para
   entender qué rodea al cambio.
5. **Loose-ends introducidos por el diff:** buscá marcadores que la **propia rama** dejó —
   `TODO`/`FIXME`/`HACK`/`XXX`, `unimplemented!`/`todo!()`, `unwrap()`/`expect()` nuevos en caminos nuevos,
   `_ =>` no exhaustivo, placeholders, stubs, valores hardcodeados, `console.log`/`dbg!` colados.
6. **Ubicación arquitectónica:** con `graphify-out/graph-index.md`, ubicá el cluster/community y anotá si tocó
   un **god-node** o un **hyperedge** (blast-radius hacia consumidores).

**Salida de este step — estructurada, no prosa vaga:**
- (a) **Problema que resuelve.**
- (b) **Mecanismo** — cómo lo resuelve.
- (c) **Non-goals** — qué dejó deliberadamente afuera (esto protege la disciplina de alcance del Step 2).
- (d) **Cluster / god-node / hyperedge tocado.**

**Early-exit:** si el diff es trivial (rename, typo, bump de versión, formato) o la rama no diverge de la base,
o si tras leer el diff **no podés articular la intención en 2–3 frases** → di **«sin follow-ups que valgan la
pena»** (o «alcance no claro — pido contexto») y **termina ahí**. No inventes follow-ups.

## Step 2 — Generar y filtrar en un solo paso
Recorré las lentes de abajo. **Por cada lente que dispare**, aplicá los **tres gates ANTES de escribir el ítem**;
si falla cualquiera, descartalo en silencio (no lo menciones):

1. **En-alcance** — sirve la intención del Step 1. Debe poder **citar la cláusula concreta** de (a)/(b) que
   sirve. Si solo sirve a una mejora genérica del repo, está fuera de alcance.
2. **Objeto concreto** — nombra **archivo + función/símbolo/línea que la rama introdujo o tocó**. Si no podés
   apuntar a un objeto concreto del diff, **no es un follow-up** — descartalo.
3. **Valor incremental real** — auto-check honesto: «¿lo escribiría yo, como autor de esta rama, en el próximo
   PR — o es relleno para parecer exhaustivo?»

**Lentes generales** (cada una *silenciosa* si no aplica):
- **Cobertura de tests faltante** del camino nuevo (cargo tests / pytest / tsc); nombra la función/caso sin cubrir.
- **Edge cases sin manejar** del camino nuevo: null/empty/boundary, error no propagado, estado de carga/error
  en UI ausente, concurrencia/race. (Si el código *ya escrito* está mal hoy → es bug, va a `/code-review`, no acá.)
- **Loose ends del propio diff:** TODO/stub/placeholder que la rama dejó; hardcode que debería ser config;
  `match` cubierto con `_` que oculta variantes nuevas.
- **Propagación incompleta del patrón (DRY):** la rama aplicó un fix/patrón en un sitio pero hay **hermanos
  idénticos sin tocar** (mismo caso en otra ruta/worker). Nombra los sitios hermanos.
- **Documentación / discoverability:** doc de dominio en `docs/` desactualizada por el cambio; comentario donde
  la lógica nueva es no-obvia; regenerar `graphify-out/` si la rama movió/renombró estructura.

**Lentes específicas de Fintela** (gated por la superficie que la rama tocó — ver «Hechos»):
- **Drift i18n `en/es/pt`:** la rama agregó copy/keys en una locale (típ. `en`) pero falta en `es`/`pt`, o sin la
  misma estructura. Verificá también GLOSSARY ↔ término nuevo de UI.
- **`.sqlx/` desactualizado:** la rama cambió una `query!`/`query_as!` pero el diff no incluye el hash nuevo en
  `.sqlx/` → falta `cargo sqlx prepare`.
- **Down-migration / hygiene de schema:** el `down.sql` no revierte de verdad lo que hace el `up` (p. ej. up
  hace backfill, down solo dropea); columna NOT NULL / índice nuevo en tabla grande sin backfill o sin
  `CONCURRENTLY`.
- **DataCluster dual-taxonomy:** la rama agrega un caso de asset-class sin mapear a `generalized` antes de
  persistir, o sin extender `assetClassRegistry.ts` (y nunca tocando `ClusterType`).
- **Idempotencia / clasificación de fallos** en un dispatcher/worker tocado: dedup del batch PENDING, retry de
  transitorios vs fail de permanentes.
- **Snapshot faltante:** parámetro/config nuevo en el pipeline de optimización (Strategy/Fitness/Study/Portfolio)
  que no se snapshotea → reruns no reproducibles.
- **Blast-radius de god-node/hyperedge:** la rama cambió un god-node o un miembro de hyperedge → el mismo cambio
  debería **propagarse al consumidor hermano** del mismo cluster (usá el graph-index para nombrarlo).

**Anti-overlap (no invadas a los hermanos):**
- Bug en el código que la rama escribió → `/code-review`. No lo listes.
- Pulir/simplificar lo ya escrito → `/simplify`. No lo listes.
- Si el ítem es realmente un **bloqueante de cierre** (locale faltante de algo que se shipea, colisión de
  migración, sync de landing/Fintelligent) → eso lo cubre **`/finish-branch`**: menciónalo en **una sola línea**
  y **no lo desarrolles**.
- **Comprobá que la rama no lo hizo ya** (`Grep` / `git diff --name-only origin/<base>...HEAD`) antes de proponer
  algo «faltante» — no propongas un test/doc/handler que ya existe.

**Cantidad:** el default honesto es **1–2**. **Cero es una respuesta válida** y a veces la correcta — dilo sin
rodeos. Más de 3 solo si la rama genuinamente las dejó abiertas. **Sin relleno.**

## Step 3 — Reporte
Conciso, en español. Estructura:

1. **Intención y alcance** — la salida estructurada del Step 1 (problema / mecanismo / non-goals / cluster).
2. **Follow-ups** — rankeados por valor/esfuerzo. Por cada uno:
   - **Título corto.**
   - **Qué es:** en qué consiste.
   - **Por qué aporta valor (en esta rama):** atado **citando la cláusula de intención** del Step 1 (no la lente).
   - **Acción sugerida:** concreta y puntual, con **archivo(s) + función/símbolo** (p. ej. «agregar test `X` en
     `path:fn`», «manejar `None` en `file.rs:fn`», «documentar el flujo en `docs/...`», «replicar la key
     `<ns>.<key>` en `frontend/src/i18n/locales/pt/<ns>.json`»).
   - **Esfuerzo:** S / M / L.
3. **Fuera de alcance (no desarrollado):** una línea por ítem valioso que quedó afuera del propósito de la rama
   (incluidos los bloqueantes que le tocan a `/finish-branch`). Omití la sección si no hay nada.
4. **Empezá por esto:** una única recomendación de cuál hacer primero.

Lentes que no disparan **no producen texto** (silencio > relleno). El comando solo propone — si el usuario
quiere, puede pedir después que Claude implemente el follow-up elegido.
