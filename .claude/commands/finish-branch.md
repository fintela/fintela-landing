---
description: Cerrar una rama — propagación del trabajo a la landing page y a Fintelligent (agente IA), collision check vs main, commit+push+PR, y runbook post-merge preciso (GH Actions manuales, migraciones, bootstrap de worker nuevo incl. task-def de cron + IAM del invocador + soporte de dev local, tabla de secretos/env nuevos)
argument-hint: "[base-branch] (default: main)"
allowed-tools: Bash(git:*), Bash(gh:*), Read, Grep, Glob
---

Estás **cerrando la rama git actual** para shipearla. Rama base: **$1** (si está vacío, usa `main`).

Produce **UN solo reporte en español** con las secciones de abajo, EN ORDEN. Omite una subsección si la rama no tocó esos archivos. Sé **preciso**: este comando existe porque el camino de deploy de Fintela tiene fricción real (CI manual, bootstrap del task-def de cron, log groups, keys de secretos). Tu trabajo es darle al dev **el 100% de lo que tiene que hacer**, sin sorpresas.

## Hechos de deploy de Fintela (NO los re-derives — son la fuente de verdad)
- **Todo el deploy es GitHub Actions `workflow_dispatch` MANUAL — nada corre solo al mergear.**
  - `terraform-apply.yml`: input de confirmación `apply-prod`. Aplica stacks en orden: `shared → prod → prod-iam → prod-edge → prod-ops → prod-platform → prod-compute`.
  - `db-migrate.yml`: input de confirmación `migrate-prod`. Corre `cargo sqlx migrate run` en el bastión vía SSM.
  - `build-deploy.yml`: inputs `service` (clave de `infra/terraform/services.yaml`) + `tag` (opcional, default = SHA corto). Buildea+pushea la imagen y rota el service/cron/familia.
- **Matriz de provisioning por `type:` en `infra/terraform/services.yaml` — quién crea qué:**

  | `type` | task-def `:1` | log group | IAM role | ECR repo | secret *shell* |
  |---|---|---|---|---|---|
  | `worker` / `http` | terraform (módulo `ecs-service`) | terraform | **manual** (`prod-iam`) | terraform (`shared`) | terraform (`prod`) |
  | `cron` | **MANUAL** (`register-cron-td.sh`) | **MANUAL** (pre-crear) | **manual** (`prod-iam`) | terraform (`shared`) | terraform (`prod`) |
  | `on-demand` | **MANUAL** (`register-cron-td.sh`) | n/a | **manual** (`prod-iam`) | **manual** (pre-existe) | **manual** |

- El **valor** del secret SIEMPRE se pone a mano (out-of-band). `DB_SECRET_ARN` (→ `prod/fintela/db`) y `SERVICE_SECRET_ARN` (→ `prod/fintela/<svc>`) los **inyecta** `register-cron-td.sh`/`deploy.sh` en el environment del task-def — **no** van dentro del JSON del secret. Usuario/contraseña de DB salen de `prod/fintela/db`.
- **`infra/scripts/ops/register-cron-td.sh <service> <image-tag>`** registra el task-def `:1` de cron/on-demand leyendo cpu/mem/role/secret/log_group/ecr_repo de `services.yaml`. Falla si la familia ya existe (CI la posee) o si el secret no resuelve; la imagen ya debe estar en ECR.
- **Las SPAs estáticas (app frontend + landing) NO van por `services.yaml` ni por `build-deploy.yml`.** Se deployan aparte, a mano y con credenciales AWS de prod: el **app frontend** (`frontend/`) con `bash infra/scripts/deploy-frontend.sh` (`npm ci && npm run build` + `aws s3 sync build/ s3://fintela-frontend --delete`; invalidación de CloudFront opcional vía la env var `CLOUDFRONT_DISTRIBUTION_ID`); la **landing** (`landing/`) con `cd landing && bash deploy.sh` (`npm run build` + `aws s3 sync dist/ s3://fintela-landing-page --delete`) seguida de la invalidación **manual** `aws cloudfront create-invalidation --distribution-id E392FUBJHPWUL9 --paths "/*"`.
- **Un worker no vive solo: alguien lo invoca y alguien lo corre en local.** (a) **IAM** — la matriz cubre el rol *propio* del worker; pero si un servicio existente lo dispara (backend/dispatcher → `ecs:RunTask` de un on-demand; EventBridge → cron), ese **invocador** necesita permisos NUEVOS en `prod-iam` (`ecs:RunTask` + `iam:PassRole` sobre task-role y execution-role + `ecs:TagResource` si propaga tags). Terraform **no** los infiere de `services.yaml`. (b) **Local** — ningún worker se autoarranca en el stack local; se corre suelto con `make run-worker NAME=<bin>`. Si es **indispensable** para el dev local, hay que cablearlo a mano (`docker-compose*.yml` / `infra/local/dev.sh` / `infra/scripts/dev.sh`). → ambos se verifican en el **Step 8**.

---

## Step 0 — Contexto
Ejecuta y resume: `git fetch origin <base>`; `git branch --show-current`; divergencia `git rev-list --left-right --count origin/<base>...HEAD` (izq = base adelante, der = rama adelante); `git status --porcelain`; merge-base `git merge-base origin/<base> HEAD`.

## Step 1 — ¿El trabajo debe documentarse en la landing page?
La landing (`landing/` — Vite + React + MUI + i18next; sitio público, **separado del app**) vende el producto y documenta sus capacidades. **Primero cuestiónalo, no lo asumas.**
1. **Decide si aplica.** Pregúntate: ¿la rama agrega o cambia algo que un visitante/usuario percibiría como **capacidad, concepto, modo o API** del producto (una feature nueva, un concepto/modo nuevo, un endpoint público, un cambio de comportamiento visible)? Si es **puramente interno** (refactor, infra, fix sin superficie observable, tooling) → **NO**: dilo en una línea y omite el resto del Step. Si **SÍ** → hay que documentarlo en la landing.
2. **Comprueba si la rama ya lo hizo:** `git diff --name-only origin/<base>...HEAD -- landing/`. Si concluiste "sí" pero el diff **no** toca `landing/`, **márcalo como acción pendiente BLOQUEANTE** (no cierres la rama dejando la landing desincronizada con lo que se shipea).
3. **Dónde documentarlo** (elige según el cambio):
   - **Marketing (sección de la home)** — `landing/src/components/sections/`, compuestas en `landing/src/pages/HomePage.tsx`. Lo más común: **`FeaturesSection.tsx`** (añade una entrada `{ key, icon, accent }` al array `features`; el copy va por i18n en `features.items.<key>.{title,description}`). Alternativas según encaje: `AdvantageSection` (fila comparativa / stat), `UseCasesSection` (audiencia), `FintelAgentSection` (capacidad del agente), `DevExperienceSection` (API/integración), `FAQSection` (pregunta nueva), `WorkflowSection` (nodo del pipeline).
   - **Documentación de producto** — `landing/src/docs/`. Crea un DocBlock en `src/docs/blocks/<categoría>/<feature>.tsx` (categorías: `concepts`, `modes`, `api`, `getting-started`) y **regístralo** en `src/docs/blocks/index.ts`. Si necesita página propia: componente en `src/docs/pages/` + entrada en `src/docs/nav.ts` + ruta lazy en `src/App.tsx`. **El contenido de docs es JSX inline (NO i18n).**
4. **i18n OBLIGATORIO para todo copy de marketing.** Toda key nueva en `landing/src/i18n/locales/en/<ns>.json` (típicamente `home.json`) debe replicarse con la **misma estructura** en `es/` y `pt/`. Si falta una key, se renderiza el path literal de la key (no crashea, pero se ve roto). Las **3 locales** se editan juntas.
5. **Verifica en local:** `cd landing && npm install && npm run dev` (puerto 5173); revisa la sección/doc y **cambia el idioma** para confirmar en/es/pt.
6. **Deploy** — la landing **no** va por `build-deploy`; es un deploy estático aparte (`cd landing && bash deploy.sh` + invalidación de CloudFront, ver Hechos). → al checklist final.

## Step 2 — ¿El trabajo le compete a Fintelligent? (alineación del agente)
Fintelligent es el agente de IA (`services/ai-agent/`, Python). Su conocimiento de la plataforma es **estático y hardcodeado**: vive en las secciones con owner de `services/ai-agent/app/prompt_sections.py` (conceptos, navegación UI, flujos — `system_prompt.py` solo las compone) y en los schemas de herramientas de los manifests por dominio en `services/ai-agent/app/tools/manifests/` (`registry.py` solo compone/despacha). **No hay sync automático**: si la rama cambia algo que el agente debería conocer/usar y no lo alineas, el agente lo ignora en silencio o falla al invocarlo.
1. **Decide si aplica.** Aplica **SÍ** si la rama introduce o cambia:
   - un **concepto/entidad** de plataforma o su semántica (strategy, fitness, study, portfolio, RM, cluster, data explorer, …);
   - una **página/ruta** de la SPA, o una **entidad/acción CRUD** que el agente debería poder operar;
   - un **endpoint backend** que el agente debería invocar, o un **cambio de contrato** (ruta/params/response/enum) de uno que ya invoca (los paths del backend están hardcodeados en los handlers → un rename los rompe con 404 **en silencio**);
   - **terminología** nueva (glosario).
   Si la rama no toca ninguna superficie que el agente conozca → **NO**: dilo en una línea y omite el resto del Step.
2. **Si aplica, alinéalo** (los archivos según el tipo de cambio):
   - **Conocimiento** — `services/ai-agent/app/prompt_sections.py`: añade/edita el concepto en la sección `platform_concepts` (o la sección del flujo que toque), manteniendo la tupla `owners` correcta — esa sección viaja al prompt del hub y de los spokes que la poseen. Mismo tono técnico y conciso. OJO: la composición está golden-testeada (`tests/test_composition_golden.py`); si cambias texto a propósito, regenera el fixture en el mismo commit.
   - **Herramienta nueva o cambiada** — añade una entrada `Tool(schema=..., fn=handler, domains=(<spokes dueños>,), purpose=...)` al manifest del dominio en `services/ai-agent/app/tools/manifests/<dominio>.py`, registra el nombre en `TOOL_ORDER` (`manifests/__init__.py`) e implementa el handler `async def h(inp, client: BackendClient)` en `app/tools/<dominio>.py`. `domains` decide qué spokes/perfiles del router la cargan en modo router/hub. Si el backend agregó valores a un enum que el agente usa, actualiza las listas de `app/tools/base.py` (`_METRIC_NAMES`, `_PORTFOLIO_STAGES`, `_OPT_STAGES`). Schema y handler cambian **en lockstep** con el contrato del backend (regenera el fixture golden de schemas en el mismo commit).
   - **Operar la UI (registro DUAL backend ↔ frontend — falta en cualquiera de los dos = falla silenciosa):**
     - **Página nueva**: añádela al enum `page` de `ui_navigate` en `app/tools/manifests/ui.py` **y** a `PAGE_ROUTES` en `frontend/src/layouts/AppShell/AppShell.tsx`.
     - **Entidad/acción CRUD nueva**: añádela al enum de `ui_crud_action` en `app/tools/manifests/ui.py`, documenta entidad+acciones en la sección `ui_navigation` de `prompt_sections.py`, y asegúrate de que la página se suscribe con `useAgentActionSubscription`.
     - **Herramienta de UI nueva** (raro): agrégala a `UI_ACTION_TOOLS` en `frontend/src/layouts/AppShell/ChatPanel.tsx` además del registry.
     - **Labels**: `frontend/src/features/ai/fintelligent/utils/toolLabels.ts` (+ i18n del namespace `ai`).
   - **Glosario** — `frontend/src/i18n/GLOSSARY.md`: añade el término nuevo y mantenlo **idéntico** al usado en `prompt_sections.py`.
   - **Evals** — extiende `services/ai-agent/EVAL_SUITE.md` con casos que ejerciten la capacidad nueva (no corre en CI; córrelo a mano para confirmar que el agente la entiende y la usa).
3. **Comprueba si la rama ya lo hizo:** `git diff --name-only origin/<base>...HEAD -- services/ai-agent/ frontend/src/layouts/AppShell/ frontend/src/features/ai/`. Si concluiste "le compete" pero el diff no incluye la alineación, **márcalo como acción pendiente BLOQUEANTE**.
4. **Deploy** — los cambios de prompt/tools/registry **no surten efecto sin redeploy**:
   - backend del agente → **build-deploy** con `service=ai-agent`;
   - cambios del frontend (`PAGE_ROUTES`, `ChatPanel`, `toolLabels`, `GLOSSARY`) → deploy estático del app frontend (`bash infra/scripts/deploy-frontend.sh`), **no** build-deploy.
   → al checklist final.

## Step 3 — Collision check vs `<base>`
1. **Migraciones (la causa #1 de conflictos).** Migraciones nuevas de la rama: `git diff --name-only --diff-filter=A origin/<base>...HEAD -- 'migrations/*.up.sql'`. Extrae el prefijo timestamp (todo antes del primer `_`). Compara contra los prefijos de `git ls-tree -r --name-only origin/<base> -- migrations/ | grep '\.up\.sql$'`. **Si un prefijo de la rama también existe en base con OTRO nombre → COLISIÓN**: repórtala y recomienda renumerar al siguiente timestamp libre que ordene **después** de todos los existentes (convención de main; p. ej. main renumeró tokens `20260616*`→`20260617*`).
2. **Conflictos generales.** Si base avanzó desde el merge-base, lista archivos tocados en AMBOS lados (intersección de `git diff --name-only <merge-base> origin/<base>` y `git diff --name-only <merge-base> HEAD`); marca especialmente `.sqlx/` y `infra/terraform/services.yaml`.
3. **Deriva de estilo del frontend / landing (no es un conflicto de merge, pero rompe la coherencia visual).** Si `<base>` avanzó desde el merge-base cambiando **estilos o componentes compartidos** del app frontend o de la landing, y la rama agrega o toca UI, el avance de la rama **tiene que adaptarse al nuevo estilo** — aunque no haya colisión de archivos. Detección:
   - Mira si base tocó superficie de estilo/componentes: `git diff --name-only <merge-base> origin/<base> -- 'frontend/src/components/**' 'frontend/src/theme/**' 'frontend/src/**/*.css' 'frontend/**/tokens*' 'landing/src/components/**' 'landing/src/theme/**' 'landing/src/**/*.css'` (ajusta a los paths reales de tokens/tema/primitives del repo). Concentra la atención en los **primitives/tema/design-tokens compartidos** (`frontend/src/components/primitives/`, barrels de `@/components`, tema MUI, tokens de la landing), no en cambios de una sola página.
   - Si base **renombró, movió, reescribió la API de props, o redefinió tokens/tema** de un componente o estilo compartido que la rama también usa (o cuyo patrón antiguo la rama copió para su UI nueva), **márcalo como acción pendiente BLOQUEANTE**: la UI nueva de la rama debe migrarse al nuevo componente/props/tokens antes de cerrar, para no shipear UI con el estilo viejo. Nombra el/los componente(s) o tokens concretos y los archivos de la rama que hay que adaptar.
   - Si base no tocó estilo/componentes compartidos, o la rama no agrega UI → **una línea diciéndolo** y sigue.
4. Reporta **PASS** (sin colisiones ni deriva de estilo) o la lista exacta + el fix sugerido. **No auto-rebasees ni auto-migres** — solo reporta.

## Step 4 — Commit (TODO) + push + PR
1. **Commitea TODO lo pendiente, sin excepciones**: `git add -A` y luego `git commit` con un mensaje **Conventional Commits** inferido del diff/nombre de rama (`<type>(<scope>): <resumen>` + cuerpo breve con los bloques de cambio). **NO agregues ningún trailer de co-author de IA** (regla de CLAUDE.md). Si el working tree ya está limpio, omite el commit.
2. **Push**: `git push -u origin <branch>`; usa `--force-with-lease` solo si la rama remota ya existe y divergió.
3. **PR**: si hay `gh`, `gh pr view --json url -q .url` (si existe, da el link) o si no `gh pr create --base <base> --fill` y da el link. Si **no hay `gh`**, deriva owner/repo de `git remote get-url origin` y entrega `https://github.com/<owner>/<repo>/compare/<base>...<branch>?expand=1`.

## Step 5 — Runbook de acciones manuales (a la medida del diff)
Calcula `git diff --name-only origin/<base>...HEAD` y emite SOLO lo que aplique. Encabeza recordando: **todo es `workflow_dispatch` manual; nada corre al mergear.**
- Cambió `migrations/` → **db-migrate** (Actions → `db-migrate`, confirm `migrate-prod`).
- Cambió `infra/terraform/**` → **terraform-apply** (Actions → `terraform-apply`, confirm `apply-prod`; aplica los stacks en el orden de arriba — crea ECR/secret-shell/IAM declarado/task-defs+log-groups de worker/reglas de cron).
- Por cada servicio con código cambiado (mapea `services/<name>/` a su clave en `services.yaml`) → **build-deploy** (`service=<name>`, `tag=<sha>`). El agente Fintelligent es el servicio `ai-agent`.
- Cambió `frontend/` (la SPA del app) → **deploy estático aparte, NO build-deploy**: `bash infra/scripts/deploy-frontend.sh` (ver Hechos).
- Cambió `landing/` → **deploy estático de la landing, NO build-deploy**: `cd landing && bash deploy.sh` + invalidación de CloudFront (ver Hechos y el **Step 1**).
- **Worker nuevo** (entrada `type:` nueva en `services.yaml` según el diff) → nómbralo y su tipo. **Cualquier** worker nuevo pasa por el **Step 8** (IAM end-to-end + soporte de dev local); si además es `cron`/`on-demand`, primero su bootstrap en el **Step 7**.

## Step 6 — Secretos / env vars nuevos (auto-derivado leyendo el código)
Si el diff de `services.yaml` agrega servicios con `secret:`:
1. Para cada uno, **lee `services/<svc>/src/main.rs`** (o el equivalente Python) y encuentra los `env::var("KEY")` **requeridos** (los que NO tienen `.unwrap_or(...)`/default y harían `return Err`). Resta los inyectados (`DB_SECRET_ARN`, `SERVICE_SECRET_ARN`) y los que vienen del DB-secret (usuario/clave). Lo que queda = las **keys que van en el JSON de `prod/fintela/<svc>`** (típicamente `DB_HOST`, `DB_NAME`).
2. Emite una tabla **| Key | Valor de ejemplo (formato) |**, p. ej.:

   | Key | Valor de ejemplo |
   |---|---|
   | `DB_HOST` | `fintela-db.cluster-xxxx.us-east-2.rds.amazonaws.com` |
   | `DB_NAME` | `fintela` |

3. Nota cómo setearlo: `aws secretsmanager put-secret-value --region us-east-2 --secret-id prod/fintela/<svc> --secret-string '{"DB_HOST":"...","DB_NAME":"fintela"}'`. Recuerda: `DB_SECRET_ARN`/`SERVICE_SECRET_ARN` **no** van aquí (se inyectan).

## Step 7 — Bootstrap especial de cron / on-demand (solo si la rama agrega uno)
`worker`/`http` **no** necesitan esto (terraform crea su `:1` + log group). Para **`cron`/`on-demand`**, tras `terraform-apply` y con el valor del secret seteado, en ESTE orden:
1. **Log group** `/ecs/fintela-<name>`: declararlo en terraform (`aws_cloudwatch_log_group` en `prod-compute`) — preferido — o `aws logs create-log-group --region us-east-2 --log-group-name /ecs/fintela-<name>`. **Por qué**: el task-def trae `awslogs-create-group=true`, pero `ecsTaskExecutionRole` no tiene `logs:CreateLogGroup`, así que el task muere si el grupo no existe.
2. **Push de la imagen**: `gh workflow run build-deploy.yml -f service=<name> -f tag=<sha>`. Su paso de task-def **fallará** en este primer cron/on-demand (clona una revisión inexistente — esperado); la imagen igual queda en ECR.
3. **Registrar `:1`**: `bash infra/scripts/ops/register-cron-td.sh <name> <sha>`. Prerrequisitos: ECR repo + IAM role + secret existentes; imagen en ECR. Ahora el target del cron resuelve.
4. **Primer run / backfill**: cron → RunTask del task-def nuevo (o espera el schedule); on-demand → dispáralo vía su dispatcher. Verifica logs en CloudWatch `/ecs/fintela-<name>`.
5. De aquí en más, `build-deploy` clona `:1`→`:2`… automáticamente.

Más detalle del alta del worker: ver el skill `create-worker` (este comando es la "última milla").

## Step 8 — Verificaciones de un worker nuevo (solo si la rama agrega o cambia uno)
Aplica a **cualquier** `type:` (no solo cron/on-demand). Son verificaciones **post-`terraform-apply`**, no asunciones: confirma que el worker realmente puede arrancar y que el equipo lo puede correr.
1. **Permisos IAM end-to-end (que el apply los deje completos).** La matriz de "Hechos" cubre el rol *propio* del worker; lo transversal es lo que se olvida:
   - **Rol propio** — confirma que `Fintela<Name>Role` existe y trae lo que el worker usa (secrets `secretsmanager:GetSecretValue`, KMS decrypt si toca credenciales de broker, etc.): `aws iam get-role --role-name Fintela<Name>Role` + `get-role-policy`.
   - **Quién lo dispara** — si un servicio existente invoca al worker nuevo, ese **invocador** necesita permisos NUEVOS que también deben entrar en `prod-iam` y aplicarse. Casos típicos:
     - on-demand lanzado por backend/dispatcher (`ecs:RunTask`) → el rol del invocador necesita `ecs:RunTask` sobre el ARN del nuevo task-def + `iam:PassRole` sobre task-role y execution-role (`iam:PassedToService=ecs-tasks.amazonaws.com`) + `ecs:TagResource` con `ecs:CreateAction=RunTask` si propaga tags (si no, las tasks quedan sin etiquetar en Cost Explorer). Patrón: `prod-iam/dispatcher-tag-tasks.tf` y los policies de `FintelaOptimizationDispatcherRole` / `FintelaPortfolioDispatcherRole`.
     - cron lanzado por EventBridge → `ecsEventsRole` con `ecs:RunTask` + `iam:PassRole` (y `ecs:TagResource`) en `prod-compute/crons.tf`.
   - **Verifica de verdad** — nombra el rol del invocador y el permiso que le falta; si no está en el diff de `prod-iam`, **márcalo como acción pendiente** (no asumas que existe). Confirma con un **primer run real** que arranca sin `AccessDenied` (logs en `/ecs/fintela-<name>`).
2. **Soporte de desarrollo local (solo si el worker es indispensable para `make dev`/`make setup`/`make local`).** Por defecto un worker **no** se autoarranca: se corre suelto con `make run-worker NAME=<bin>` (solo requiere el miembro en `Cargo.toml`) — para la mayoría eso basta; déjalo documentado y no toques nada más.
   - PERO si otros servicios locales **dependen** de este worker (o el flujo local lo necesita arriba para funcionar), cableálo al stack: añádelo a `docker-compose.yml`/`docker-compose.rust.yml` y/o a la lista de procesos de `infra/local/dev.sh` / `infra/scripts/dev.sh`, y menciónalo en `infra/local/README.md`. **Verifica** que tras `make dev`/`make setup`/`make local` el worker **realmente queda corriendo**.
   - Reporta explícitamente cuál de los dos casos aplica (suelto vía `run-worker` vs. cableado al stack) para que nadie quede con un stack local silenciosamente incompleto.

---

## Salida
Un reporte conciso en español con las secciones que apliquen (omite el **Step 1** si la rama no tiene superficie de producto observable; el **Step 2** si no le compete a Fintelligent; y los **Steps 6–8** si no agrega secretos/worker). Cierra con un **checklist ordenado** de los comandos/acciones manuales exactos a ejecutar — incluye ahí la documentación de la landing y su deploy estático (Step 1), la alineación de Fintelligent y su redeploy (Step 2), los permisos IAM del **invocador** y el cableado de **dev local** cuando apliquen (Step 8).
