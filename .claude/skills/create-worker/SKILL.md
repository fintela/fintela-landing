---
name: create-worker
description: >-
  Registrar un nuevo worker de Fintela de punta a punta: long-running worker, cron
  programado, u on-demand task. Cubre entrada en services.yaml, código (Rust/Python),
  rol IAM, secret, ECR, bootstrap Terraform (módulos ecs-service / ecs-scheduled-task)
  y deploy por CI. Usar al añadir cualquier microservicio de fondo/batch nuevo —
  "worker", "updater", "dispatcher", "scheduled task", "cron", "on-demand task".
---

# Crear un worker nuevo (Fintela)

Runbook para dar de alta un microservicio de fondo. Fintela tiene **exactamente tres
tipos** de worker, que mapean al campo `type` del manifiesto
[`infra/terraform/services.yaml`](../../../infra/terraform/services.yaml):

| Tipo (lo que dirías) | `type:` en el manifiesto | Qué es | Ejemplos en el repo |
|---|---|---|---|
| **Long-running / worker** | `worker` | ECS service sin puerto que sondea/consume en loop | `optimization-dispatcher`, `status-updater`, `alpaca-orchestrator` |
| **Scheduled / cron** | `cron` | EventBridge cron → ECS RunTask (batch one-shot) | `metrics-updater`, `indicators-updater`, `index-components-updater` |
| **On-demand** | `on-demand` | Familia de task-def lanzada por un dispatcher vía `RunTask` (sin service ni regla) | `portfolio-updater`, `optimizer` |

> `http` (ALB + subdominio) NO es un worker; para eso no uses este Skill.

`services.yaml` es la **fuente de verdad única**. Lenguaje por defecto **Rust** (dominante);
los `on-demand` son **Python**.

---

## Modelo mental: qué es automático vs. manual

Sé honesto con esto — el camino está pavimentado **a medias**. Lo que el manifiesto + CI te
dan gratis, y lo que tú tienes que traer:

| Pieza | ¿Automático desde el manifiesto? | Dónde / cómo |
|---|---|---|
| Bloque YAML del manifiesto | sí, a `/tmp` (pegar a mano) | `make new-service` → `scaffold/new-service.sh` |
| **ECR repo** | **sí** (`for_each local.ecr_repos`; excluye `on-demand`) | `live/shared` apply |
| **Secret container** (no el valor) | **sí** (`for_each local.secret_services`) | `live/prod` apply |
| build/push imagen + roll deploy | **sí**, los 3 tipos | `.github/workflows/build-deploy.yml` |
| Rol IAM `Fintela<Name>Role` | **no** — manual | `live/prod-iam/<svc>.tf` (uno por servicio; `generated.tf` solo importa roles existentes) |
| **Log group** `/ecs/fintela-<name>` | **worker/http: sí** · **cron: NO → pre-crear** · on-demand: n/a | worker/http: módulo `ecs-service`. cron: decláralo en `prod-compute` (`aws_cloudwatch_log_group`) o `aws logs create-log-group`; `awslogs-create-group=true` **falla** porque `ecsTaskExecutionRole` no tiene `logs:CreateLogGroup` |
| **Task-def `:1`** + service/regla/familia | **worker/http: sí** (módulo `ecs-service`) · **cron/on-demand: NO** | cron/on-demand → `infra/scripts/ops/register-cron-td.sh <svc> <tag>` (§5b), una sola vez |
| Código del worker (+ workspace member / Dockerfile) | **no** | `services/<name>/`, root `Cargo.toml` |
| Valor del secret | **no** — out-of-band | AWS console / CLI |

**Tres brechas que importan y que este runbook resuelve:**

1. **`build-deploy.yml` NO bootstrappea.** Para `worker` hace `describe-services` y clona su
   task-def; para `cron` hace `list-targets-by-rule` y repunta; para `on-demand` hace
   `describe-task-definition --task-definition <familia>`. Los tres **necesitan que ya exista**
   el recurso. La PRIMERA task-def la creas tú: worker/http vía módulo (paso 5), cron/on-demand
   vía `register-cron-td.sh` (§5b).
2. **`live/prod-compute` adopta por import** (mapas `locals.workers` / `locals.crons`
   hardcodeados con ARNs reales y `ignore_changes`). **No toques esos mapas.**
3. **cron/on-demand: 3 cosas que muerden** y que terraform NO te da: (a) el **log group**
   `/ecs/fintela-<name>` hay que **pre-crearlo** (si no, el task muere con
   `ResourceInitializationError`: `ecsTaskExecutionRole` no puede `logs:CreateLogGroup`); (b) las
   **keys del secret** hay que **derivarlas del código** (§4); (c) la **primera task-def `:1`** se
   registra a mano con `register-cron-td.sh` (§5b).

> **⚠️ Camino REAL para `cron`/`on-demand` (lo que de verdad se usa en este repo).** Los crons
> nuevos **no** usan el módulo `managed_crons` de "Setup único" — ese path nunca se cableó en
> `prod-compute` (no existe `managed.tf`). El path en producción es **adoptar** la regla en
> `crons.tf` (`local.crons`, entrada `td` apuntando a `:1` con `ignore_changes`) + un **log group
> declarado** en `prod-compute` + **`register-cron-td.sh`** para el `:1`. Copia
> `token-reconciler` o `markets-snapshot-updater` (entrada en `crons.tf` + `prod-iam/<svc>.tf` +
> `aws_cloudwatch_log_group`). El bloque `managed_crons` de "Setup único"/paso 5 queda como
> alternativa **no usada** — prefiere el adopt-path y el §5b. El módulo `managed_workers`
> (`ecs-service`) sí es válido para `worker`/`http`.

---

## Setup único (solo la primera vez que se use este Skill)

`prod-compute` aún no instancia los módulos para servicios nuevos. Añade **una vez** los
mapas `managed_*` y los bloques `module` (separados de los `local.workers`/`local.crons`
adoptados, que quedan intactos). Después, cada worker nuevo es solo **una entrada de mapa**.

En `infra/terraform/live/prod-compute/` (nuevo archivo `managed.tf`):

```hcl
# ── Servicios GESTIONADOS por Terraform (creados desde cero por los módulos) ──
# A diferencia de local.workers / local.crons (adoptados por import, hardcodeados),
# estos los CREA Terraform: log-group + task-def + service/regla. La imagen la rola
# build-deploy después (los módulos ya hacen ignore_changes en task_definition).
locals {
  exec_role_arn = "arn:aws:iam::${local.account_id}:role/ecsTaskExecutionRole"

  managed_workers = {
    # <name> = { cpu = "512", memory = "1024", task_role = "Fintela<Name>Role",
    #            log_group = "/ecs/fintela-<name>", sg = local.cron_sg[0],
    #            image = "${local.account_id}.dkr.ecr.${local.region}.amazonaws.com/<ecr_repo>:bootstrap",
    #            env = { MAX_CONNECTIONS = "10", ACQUIRE_TIMEOUT = "30", DB_NAME = "fintela",
    #                    DB_SECRET_ARN = "prod/fintela/db", SERVICE_SECRET_ARN = "prod/fintela/<name>" } }
  }

  managed_crons = {
    # <name> = { cpu = "512", memory = "1024", task_role = "Fintela<Name>Role",
    #            log_group = "/ecs/fintela-<name>", schedule = "cron(0 6 * * ? *)",
    #            image = "${local.account_id}.dkr.ecr.${local.region}.amazonaws.com/<ecr_repo>:bootstrap",
    #            env = { ... } }
  }
}

module "managed_worker" {
  source   = "../../modules/ecs-service"
  for_each = local.managed_workers

  name                 = "fintela-${each.key}-service"
  family               = "fintela-${each.key}"
  cluster_id           = local.cluster_arn
  cluster_name         = "fintela"
  region               = local.region
  cpu                  = each.value.cpu
  memory               = each.value.memory
  image                = each.value.image
  container_port       = null              # worker = sin puerto
  enable_load_balancer = false
  enable_autoscaling   = false             # actívalo luego si hace falta
  execution_role_arn   = local.exec_role_arn
  task_role_arn        = "arn:aws:iam::${local.account_id}:role/${each.value.task_role}"
  log_group_name       = each.value.log_group
  environment          = each.value.env
  subnet_ids           = local.private_subnet_ids
  security_group_ids   = [each.value.sg]
  tags                 = merge(local.common_tags, { Service = each.key, Component = "worker" })
}

module "managed_cron" {
  source   = "../../modules/ecs-scheduled-task"
  for_each = local.managed_crons

  name                 = each.key            # = nombre de la regla EventBridge
  family               = "fintela-${each.key}"
  cluster_arn          = local.cluster_arn
  region               = local.region
  schedule_expression  = each.value.schedule
  cpu                  = each.value.cpu
  memory               = each.value.memory
  image                = each.value.image
  execution_role_arn   = local.exec_role_arn
  task_role_arn        = "arn:aws:iam::${local.account_id}:role/${each.value.task_role}"
  eventbridge_role_arn = local.eventbridge_role_arn   # ya existe en crons.tf
  log_group_name       = each.value.log_group
  environment          = each.value.env
  subnet_ids           = local.cron_subnets
  security_group_ids   = local.cron_sg
  tags                 = merge(local.common_tags, { Service = each.key, Component = "cron" })
}
```

`local.eventbridge_role_arn`, `local.cron_subnets`, `local.cron_sg`, `local.cluster_arn`,
`local.private_subnet_ids`, `local.account_id`, `local.region`, `local.common_tags` ya están
definidos en `crons.tf` / `locals.tf`. Con los mapas vacíos, `terraform validate` y `plan`
deben dar **0 cambios**.

---

## Runbook paso a paso (ejemplo: cron Rust `demo-updater`)

### 0. Decidir
- **nombre** kebab-case (= bin = package = `ecr_repo` = sufijo del rol/secret/log).
- **`TYPE`** = `worker` | `cron` | `on-demand`; **`LANGUAGE`** = `rust` | `python`.
- `uses_db` (casi siempre `true`), `CPU`/`MEMORY`, y según tipo: `SCHEDULE` (cron) o
  `task_def_family` (on-demand).

### 1. Generar la entrada del manifiesto
```bash
make new-service NAME=demo-updater TYPE=cron LANGUAGE=rust \
  SCHEDULE="cron(0 6 * * ? *)" CPU=512 MEMORY=1024 USES_DB=true
```
Imprime un bloque YAML en `/tmp/fintela-new-service-demo-updater.yaml`. **Pégalo bajo
`services:`** en `infra/terraform/services.yaml`. Revísalo:
- ⚠️ **Bug conocido del scaffold (Rust):** la línea `build_arg:` sale con **2 espacios** de
  indentación en vez de 4 — corrígela a `    build_arg: { SERVICE_NAME: <name> }` al pegar, o
  el YAML queda inválido. (Solo afecta a Rust; Python/Node no emiten `build_arg`.)
- `cron` → debe tener `schedule:`. Si la regla EventBridge tendrá un nombre distinto a la
  key, añade `rule_name: <otro-nombre>` (lo usa el path cron de build-deploy).
- `worker` → sin `container_port` / `host` / `desired_count`.
- `on-demand` → añade `task_def_family: fintela-<name>` y **quita** `secret`/`log_group`
  si replicas el patrón de `portfolio-updater`/`optimizer` (gestionados out-of-band);
  su `ecr_repo` queda **excluido** del `for_each` de ECR (debe preexistir).

### 2. Escribir el código del worker

**Rust** — crea `services/demo-updater/Cargo.toml`:
```toml
[package]
name = "demo-updater"     # DEBE == SERVICE_NAME (build arg) == nombre del bin
version = "0.1.0"
edition = "2024"          # convención del repo (sí, "2024")

[dependencies]
db-models = { path = "../../crates/db-models" }
cloud-aws = { path = "../../crates/cloud-aws" }
eod-api   = { path = "../../crates/eod-api" }   # solo si llamas a la EOD API
tokio     = { workspace = true }
sqlx      = { workspace = true }
dotenvy   = { workspace = true }
serde     = { workspace = true }
serde_json = { workspace = true }
thiserror = { workspace = true }
```

Añade el miembro al **root `Cargo.toml`** (`[workspace] members`):
```toml
    "services/demo-updater",
```

`services/demo-updater/src/main.rs` — patrón estándar (cron = one-shot). Replica
[`services/index-components-updater/src/main.rs`](../../../services/index-components-updater/src/main.rs):
```rust
use cloud_aws::secret::{DbSecret, get_db_secret, get_secret_as_map};
use db_models::helpers::connection::build_connection_url;
use sqlx::postgres::PgPoolOptions;
use std::{env, time::Duration};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    // 1) Carga el SERVICE_SECRET_ARN (config) al entorno antes de leer envs.
    //    En prod ECS lo inyecta el contenedor; en local no está y se omite.
    if let Ok(arn) = env::var("SERVICE_SECRET_ARN") {
        if let Ok(vars) = get_secret_as_map(&arn).await {
            for (k, v) in vars {
                if env::var(&k).is_err() {
                    // SAFETY: en main, antes de crear otros hilos.
                    unsafe { env::set_var(k, v); }
                }
            }
        }
    }

    // 2) DB: get_db_secret usa DB_USERNAME/DB_PASSWORD si están (fallback local),
    //    si no, lee Secrets Manager por DB_SECRET_ARN.
    let db_secret_arn = env::var("DB_SECRET_ARN").expect("DB_SECRET_ARN");
    let secret: DbSecret = get_db_secret(&db_secret_arn).await.expect("db secret");
    let host = env::var("DB_HOST").unwrap_or_else(|_| "localhost".into());
    let port: u16 = env::var("DB_PORT").unwrap_or_else(|_| "5432".into()).parse().unwrap();
    let name = env::var("DB_NAME").unwrap_or_else(|_| "fintela".into());

    let pool = PgPoolOptions::new()
        .max_connections(env::var("MAX_CONNECTIONS").unwrap_or_else(|_| "10".into()).parse().unwrap())
        .acquire_timeout(Duration::from_secs(30))
        .connect(&build_connection_url(&host, port, &secret.username, &secret.password, &name))
        .await
        .expect("db connect");

    // 3) Tu lógica batch aquí (one-shot para cron; sale al terminar).
    let _ = &pool;
    println!("demo-updater done");
}
```
**Variante `worker` (long-running):** en vez de salir, envuelve la lógica en
`loop { run(&pool).await; tokio::time::sleep(Duration::from_secs(poll_interval)).await; }`
leyendo `POLL_INTERVAL_SECS` (ver `services/optimization-dispatcher/src/main.rs`).

Si usas macros `sqlx::query!`, **regenera el cache offline** (el Dockerfile compila con
`SQLX_OFFLINE=true`):
```bash
DATABASE_URL=postgres://... cargo sqlx prepare --workspace
```

**Python (on-demand):** crea `services/demo-updater/` (`main.py` + `requirements.txt`,
reutilizando `db_connection.py` / `utilities.py` con el fallback de secret) y
`infra/docker/python-demo-updater/Dockerfile` espejando
[`infra/docker/python-portfolio-updater/Dockerfile`](../../../infra/docker/python-portfolio-updater/Dockerfile).
No hay Dockerfile genérico para Python (uno por servicio); Rust sí lo tiene.

> **Rust no necesita Dockerfile propio:** el genérico
> [`infra/docker/rust-service/Dockerfile`](../../../infra/docker/rust-service/Dockerfile)
> compila `--bin ${SERVICE_NAME}`. Por eso `name` del package = `build_arg.SERVICE_NAME`.

### 3. Crear el rol IAM `Fintela<Name>Role`
No lo crea Terraform desde el manifiesto. Añádelo en `infra/terraform/live/prod-iam/<svc>.tf`
(un archivo por servicio, p.ej. `token-reconciler.tf`, `markets-snapshot-updater.tf` — **no** en
`generated.tf`, que solo importa roles ya existentes), o **reúsa `FintelaDbSecretRetrievalRole`**
(lo que hacen los on-demand). Plantilla mínima con acceso al secret de DB + al propio:
```hcl
resource "aws_iam_role" "FintelaDemoUpdaterRole" {
  name = "FintelaDemoUpdaterRole"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = "sts:AssumeRole",
                   Principal = { Service = "ecs-tasks.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy" "FintelaDemoUpdaterRole_secrets" {
  name = "fintela-demo-updater-role-policy"
  role = aws_iam_role.FintelaDemoUpdaterRole.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Sid = "ReadSecrets", Effect = "Allow",
        Action = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
        Resource = [
          "arn:aws:secretsmanager:us-east-2:176977333677:secret:prod/fintela/db-*",
          "arn:aws:secretsmanager:us-east-2:176977333677:secret:prod/fintela/demo-updater-*",
        ] },
      { Sid = "ListSecrets", Effect = "Allow",
        Action = ["secretsmanager:ListSecrets", "secretsmanager:BatchGetSecretValue"],
        Resource = "*" },
    ]
  })
}
```
```bash
terraform -chdir=infra/terraform/live/prod-iam apply
```

### 4. ECR repo + secret container (auto desde el manifiesto)
```bash
terraform -chdir=infra/terraform/live/shared apply   # crea el ECR repo
terraform -chdir=infra/terraform/live/prod   apply   # crea el secret container
```
**¿Qué keys van en el JSON del secret? Derívalas del código, no las adivines.** Son las env vars
que el worker lee como **requeridas** (`env::var(...).expect(...)` / `.map_err(...)` → falla si
faltan) en `services/<svc>/src/main.rs`, **menos** las que inyecta el runtime (`DB_SECRET_ARN`,
`SERVICE_SECRET_ARN`) y las credenciales que ya vienen del DB-secret (`username`/`password`, vía
`get_db_secret`). Casi siempre incluye `DB_HOST` y `DB_NAME` (aunque el código tenga fallback
`.unwrap_or("localhost")`/`"fintela"`, es solo para local — en prod **debes** fijarlos o el worker
se conecta a localhost). Ejemplos reales del repo:

| Servicio | Keys del secret (derivadas del `main.rs`) |
|---|---|
| `markets-snapshot-updater` | `DB_HOST`, `DB_NAME` |
| `token-reconciler` | `DB_HOST`, `DB_NAME`, `STRIPE_SECRET_KEY`, `BACKEND_URL`, `INTERNAL_API_KEY` |

Formato de valores de ejemplo (ilustrativos, no reales):

| Key | Valor de ejemplo |
|---|---|
| `DB_HOST` | `fintela-db.cluster-xxxx.us-east-2.rds.amazonaws.com` |
| `DB_NAME` | `fintela` |

Pobla el **valor** del secret out-of-band:
```bash
aws secretsmanager put-secret-value --region us-east-2 --secret-id prod/fintela/demo-updater \
  --secret-string '{"DB_HOST":"fintela-db.cluster-xxxx.us-east-2.rds.amazonaws.com","DB_NAME":"fintela"}'
```
`DB_SECRET_ARN`/`SERVICE_SECRET_ARN` **NO** van en este JSON — los inyecta
`register-cron-td.sh`/`deploy.sh` en el environment del task-def. En runtime el contenedor recibe
`SERVICE_SECRET_ARN` (config) y `DB_SECRET_ARN` (DB); la app expande el secret a env con
`get_secret_as_map` (ver paso 2). El manifiesto **no** tiene mapa `env` para vars planas → en el
adopt-path van **dentro del valor del secret**; el módulo `managed_*` (no usado) las tomaría de
`managed_*.env`.

### 5. Bootstrap IaC — crear la primera task-def + service/regla
Asegúrate de haber hecho el **"Setup único"** una vez. Luego añade **una entrada** al mapa
correspondiente en `prod-compute/managed.tf`:

`cron`:
```hcl
  managed_crons = {
    demo-updater = {
      cpu = "512", memory = "1024", task_role = "FintelaDemoUpdaterRole",
      log_group = "/ecs/fintela-demo-updater", schedule = "cron(0 6 * * ? *)",
      image = "${local.account_id}.dkr.ecr.${local.region}.amazonaws.com/demo-updater:bootstrap",
      env = { MAX_CONNECTIONS = "10", ACQUIRE_TIMEOUT = "30", DB_NAME = "fintela",
              DB_SECRET_ARN = "prod/fintela/db", SERVICE_SECRET_ARN = "prod/fintela/demo-updater" }
    }
  }
```
`worker`: igual pero en `managed_workers` (sin `schedule`).

> **Cost tagging — no te lo saltes.** Los `worker` que no están en el mapa `local.workers`
> (adoptados) de `prod-compute/locals.tf` se crean automáticamente vía el `for_each` de
> `local.new_workers` en `new-services.tf` — no hace falta tocar Terraform para el servicio en sí.
> Pero su tag `Tier` sale de `try(local.service_tier[each.key], "unset")`
> (`new-services.tf:105`), y ese mapa **no** se llena solo: añade **a mano** una entrada
> `<name> = "<tier>"` (app/compute/data/billing/platform — ver `COSTS.md`) a `service_tier` en
> `prod-compute/locals.tf`, o el worker queda con `Tier=unset` en Cost Explorer indefinidamente.

```bash
terraform -chdir=infra/terraform/live/prod-compute plan    # revisa: crea log-group + task-def + (cron) regla/target
terraform -chdir=infra/terraform/live/prod-compute apply
```
> La `image: ...:bootstrap` es un placeholder; el módulo registra la task-def y luego
> `ignore_changes=[task_definition]` deja que build-deploy la rote. Empuja una imagen con
> ese tag o deja que el paso 6 registre la buena (build-deploy clona la task-def viva).

**`on-demand` (sin service ni regla, solo familia):** los módulos no modelan "familia sola".
Registra la primera revisión como recurso TF en `prod-compute` (recomendado):
```hcl
resource "aws_ecs_task_definition" "demo_ondemand" {
  family                   = "fintela-demo-updater"     # == task_def_family del manifiesto
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = local.exec_role_arn
  task_role_arn            = "arn:aws:iam::${local.account_id}:role/FintelaDbSecretRetrievalRole"
  container_definitions = jsonencode([{
    name = "main-container", essential = true,
    image = "${local.account_id}.dkr.ecr.${local.region}.amazonaws.com/demo-updater:bootstrap",
    logConfiguration = { logDriver = "awslogs", options = {
      "awslogs-group" = "/ecs/fintela-demo-updater", "awslogs-region" = local.region,
      "awslogs-stream-prefix" = "ecs" } }
  }])
  lifecycle { ignore_changes = [container_definitions] }   # CI rota la imagen
}
```
(o `aws ecs register-task-definition` una vez, y build-deploy clona después).

### 5b. (cron / on-demand) Registrar la primera task-def `:1` + log group
**Este es el camino REAL para cron/on-demand** (lo usan `token-reconciler` y
`markets-snapshot-updater`). Terraform NO crea su `:1` (`crons.tf` solo adopta rule+target y
referencia el `td`). Orden exacto, tras `apply` de prod-iam/prod-compute y con el secret poblado (§4):

1. **Pre-crea el log group** `/ecs/fintela-<name>`. Decláralo en `prod-compute`
   (`aws_cloudwatch_log_group`, como `markets_snapshot_updater` en `crons.tf`) — preferido — o:
   ```bash
   aws logs create-log-group --region us-east-2 --log-group-name /ecs/fintela-demo-updater
   ```
   **Por qué:** la task-def trae `awslogs-create-group=true`, pero `ecsTaskExecutionRole` no tiene
   `logs:CreateLogGroup` → sin el grupo, la task muere con `ResourceInitializationError`.
2. **Empuja la imagen** (su paso de task-def fallará — esperado en el primer cron):
   ```bash
   gh workflow run build-deploy.yml -f service=demo-updater -f tag=<sha>
   ```
   build-deploy clona la revisión viva; como `:1` aún no existe, **falla con `exit 254`** en el
   paso de task-def. Da igual: el build+push de la imagen ya corrió antes, queda en ECR.
3. **Registra `:1`** desde el manifiesto (lee cpu/mem/role/secret/log_group/ecr_repo de
   services.yaml; inyecta `DB_SECRET_ARN`/`SERVICE_SECRET_ARN` resolviendo sus ARNs):
   ```bash
   bash infra/scripts/ops/register-cron-td.sh demo-updater <sha>   # DRY_RUN=1 para previsualizar
   ```
   Requiere el **Python yq** (no el de Go/mikefarah), `jq`, `aws`. Falla si la familia ya existe
   (CI la posee) o si el secret no resuelve. La regla EventBridge ya apunta a `:1`.
4. **Primer run / backfill** y verificación:
   ```bash
   # cron: RunTask manual del :1 (o espera el schedule)
   aws ecs run-task --region us-east-2 --cluster fintela --launch-type FARGATE \
     --task-definition fintela-demo-updater \
     --network-configuration '{"awsvpcConfiguration":{"subnets":["subnet-..."],"securityGroups":["sg-..."],"assignPublicIp":"DISABLED"}}'
   # on-demand: dispáralo vía su dispatcher
   aws logs tail /ecs/fintela-demo-updater --region us-east-2 --since 10m --follow
   ```
5. De aquí en más, **build-deploy clona `:1`→`:2`…** automáticamente (re-estampa cpu/mem del
   manifiesto). No vuelvas a correr `register-cron-td.sh`.

> `worker`/`http` **no** necesitan §5b: su `:1` + log group + service los crea el módulo
> `ecs-service` (paso 5, `managed_workers`).

### 6. Build & deploy de la imagen
```bash
gh workflow run build-deploy.yml -f service=demo-updater   # tag por defecto = SHA corto
```
- **cron**: registra task-def nueva + `put-targets` sobre `rule_name` (default = key). Requiere
  que `gha-deploy` tenga `iam:PassRole` sobre `ecsEventsRole`→`events.amazonaws.com` (ya está
  en `live/shared`).
- **worker**: `update-service --force-new-deployment` sobre `fintela-<name>-service`.
- **on-demand**: registra revisión nueva de `task_def_family`; se usa en el próximo dispatch.

### 7. Solo on-demand — conectar el dispatcher
La task on-demand la lanza un **dispatcher** (cron o worker) vía `RunTask` leyendo
`TASK_DEFINITION` = **familia pelada** (`fintela-demo-updater`, **sin** `:revision`) para que
tome la última. Revisa el dispatcher relevante (`services/portfolio-dispatcher/src/models.rs`,
`services/optimization-dispatcher/src/main.rs`): subnets/SGs van **hardcodeados** ahí —
ajústalos si tu task corre en otra red.

### 8. Local + verificación
```bash
# Rust: corre el worker una vez contra la DB local (SQLX_OFFLINE, fallback DB_USERNAME/DB_PASSWORD)
make run-worker NAME=demo-updater
cargo check -p demo-updater                 # compila el esqueleto
```
- Local sin AWS: pon `DB_USERNAME`/`DB_PASSWORD`/`DB_HOST`/`DB_PORT`/`DB_NAME` en `.env`
  (ver [`fintela-local-build-db-setup`] / `.env.example`). `get_db_secret` salta Secrets
  Manager si esas dos vars están.
- Python: corre vía docker-compose (no hay target `run-worker` para Python).
- Prod: confirma logs en `/ecs/fintela-demo-updater` y (cron) `aws events list-targets-by-rule
  --rule demo-updater`.

---

## Cheat-sheet por tipo

| | `worker` | `cron` | `on-demand` |
|---|---|---|---|
| Campos manifiesto extra | — (sin port/host) | `schedule`, opc. `rule_name` | `task_def_family`; sin `secret`/`log_group`; ECR excluido del for_each |
| Módulo TF (paso 5) | `ecs-service` (`enable_load_balancer=false`) | `ecs-scheduled-task` | `aws_ecs_task_definition` standalone |
| Qué crea el bootstrap | módulo `ecs-service`: log-group + task-def `:1` + ECS service | terraform (`crons.tf`): **solo** regla+target. **Manual (§5b): log-group + task-def `:1`** vía `register-cron-td.sh` | **Manual (§5b): task-def `:1`** vía `register-cron-td.sh` (sin regla/log-group) |
| Deploy (paso 6) | `update-service` | `register` clona `:1`→`:2` + `put-targets` | `register` clona revisión |
| Lo lanza | ECS (siempre arriba) | EventBridge (schedule) | un dispatcher (RunTask) |
| Lenguaje típico | Rust | Rust | Python |

---

## Gotchas (no te saltes esto)

- **build-deploy NO bootstrappea** — clona algo existente. Sin el paso 5 falla en
  `describe-services`/`list-targets-by-rule`/`describe-task-definition`.
- **cron/on-demand `:1` = `register-cron-td.sh`** (ni terraform ni build-deploy lo crean). Corre
  build-deploy primero (empuja la imagen aunque su paso de task-def falle con `exit 254`), luego el
  script; nunca lo corras si la familia ya existe (la posee CI). Ver §5b.
- **Log group de cron: pre-créalo** (`aws_cloudwatch_log_group` en `prod-compute` o `aws logs
  create-log-group`). `awslogs-create-group=true` falla porque `ecsTaskExecutionRole` no tiene
  `logs:CreateLogGroup` → `ResourceInitializationError`.
- **Keys del secret = derivadas del `main.rs`** (env requeridas − `DB_SECRET_ARN`/`SERVICE_SECRET_ARN`),
  típicamente `DB_HOST`/`DB_NAME`. Fíjalas aunque el código tenga fallback local, o en prod conecta a localhost.
- **Rol IAM nuevo va en `prod-iam/<svc>.tf`** (no en `generated.tf`, que solo importa roles existentes).
- **El rol IAM debe existir ANTES** del `apply` de prod-compute (el task_role_arn lo referencia).
- **No toques `local.workers` / `local.crons`** de prod-compute ni el mapa de `crons.tf` —
  son adopciones por import con `ignore_changes`. Los nuevos van en `managed_*`.
- **`SQLX_OFFLINE=true`** en el Dockerfile: si usas macros sqlx, corre `cargo sqlx prepare
  --workspace` y commitea `.sqlx/`, o el build de imagen falla.
- **`edition = "2024"`** es la convención del repo (no es typo).
- **Nombre del bin = package = `SERVICE_NAME` = key del manifiesto** (Rust). Mismatch → build falla.
- **on-demand:** `ecr_repo` debe preexistir (excluido del `for_each`); `TASK_DEFINITION` del
  dispatcher = familia pelada (un `:revision` fijo ignora las nuevas).
- **Valor del secret = out-of-band.** Terraform solo crea el contenedor vacío.
- **Sin mapa `env` en el manifiesto** — las env planas van en `managed_*.env` (módulo TF).
- **Dispatcher con subnets/SGs hardcodeados** en su `models.rs`.
- **El stack `account-baseline` NO está en la matriz de `terraform-apply`** — si tu worker
  necesita alarmas/budgets, se aplican aparte.
- **`db-migrate.yml`**: si el worker requiere una migración nueva, córrela (vía el bastión)
  antes de que el worker arranque en prod.

---

## Referencia

- Manifiesto: [`infra/terraform/services.yaml`](../../../infra/terraform/services.yaml) ·
  convenciones: `infra/terraform/CONVENTIONS.md` · `README.md`
- Scaffold: `infra/terraform/scaffold/new-service.sh` (`make new-service`) ·
  local: `make run-worker NAME=<bin>`
- Módulos: `infra/terraform/modules/ecs-service/` (worker/http) ·
  `infra/terraform/modules/ecs-scheduled-task/` (cron)
- Stacks: `live/shared` (ECR) · `live/prod` (secret) · `live/prod-iam` (roles) ·
  `live/prod-compute` (workers/crons)
- CI: `.github/workflows/build-deploy.yml`
- Secret helper: `crates/cloud-aws/src/secret.rs` (`get_db_secret`, `get_secret_as_map`,
  fallback `DB_USERNAME`/`DB_PASSWORD`)
- Ejemplos: cron `services/index-components-updater/` · worker
  `services/optimization-dispatcher/` · on-demand `services/portfolio-updater/`
