---
description: Close a branch — collision check vs main, commit+push+PR, and precise post-merge runbook (manual GH Actions, migrations, new worker bootstrap including cron task-def + invoker IAM + local dev support)
argument-hint: "[base-branch] (default: main)"
allowed-tools: Bash(git:*), Bash(gh:*), Read, Grep, Glob
---

You are **closing the current git branch** to ship it. Base branch: **$1** (if empty, use `main`).

Produce **ONE deterministic report in English**. Be **precise**: this command exists because Fintela's deploy path has real friction (manual CI, cron task-def bootstrap, log groups, secret keys). Your job is to give the dev **100% of what they must do**, with zero surprises.

## Deployment Facts of Fintela (DO NOT re-derive — these are the source of truth)
- **All deploy is manual GitHub Actions `workflow_dispatch` — nothing runs automatically on merge.**
  - `terraform-apply.yml`: confirmation input `apply-prod`. Applies stacks in order: `shared → prod → prod-iam → prod-edge → prod-ops → prod-platform → prod-compute`.
  - `db-migrate.yml`: confirmation input `migrate-prod`. Runs `cargo sqlx migrate run` on the bastion via SSM.
  - `build-deploy.yml`: inputs `service` (key from `infra/terraform/services.yaml`) + `tag` (optional, default = short SHA). Builds+pushes image and rotates the service/cron/family.
- **Provisioning matrix by `type:` in `infra/terraform/services.yaml` — who creates what:**

  | `type` | task-def `:1` | log group | IAM role | ECR repo | secret *shell* |
  |---|---|---|---|---|---|
  | `worker` / `http` | terraform (`ecs-service` module) | terraform | **manual** (`prod-iam`) | terraform (`shared`) | terraform (`prod`) |
  | `cron` | **MANUAL** (`register-cron-td.sh`) | **MANUAL** (pre-create) | **manual** (`prod-iam`) | terraform (`shared`) | terraform (`prod`) |
  | `on-demand` | **MANUAL** (`register-cron-td.sh`) | n/a | **manual** (`prod-iam`) | **manual** (pre-exists) | **manual** |

- The **value** of the secret is ALWAYS set manually (out-of-band). `DB_SECRET_ARN` (→ `prod/fintela/db`) and `SERVICE_SECRET_ARN` (→ `prod/fintela/<svc>`) are **injected** by `register-cron-td.sh`/`deploy.sh` into the task-def environment — they do **not** go inside the secret JSON. DB user/password come from `prod/fintela/db`.
- **`infra/scripts/ops/register-cron-td.sh <service> <image-tag>`** registers the `:1` task-def for cron/on-demand, reading cpu/mem/role/secret/log_group/ecr_repo from `services.yaml`. Fails if the family already exists (CI owns it) or if the secret does not resolve; image must already be in ECR.
- **Static SPAs (app frontend + landing) do NOT go through `services.yaml` or `build-deploy.yml`.** They deploy separately, manually, with prod AWS credentials: the **app frontend** (`frontend/`) with `bash infra/scripts/deploy-frontend.sh` (`npm ci && npm run build` + `aws s3 sync build/ s3://fintela-frontend --delete`; optional CloudFront invalidation via env var `CLOUDFRONT_DISTRIBUTION_ID`); the **landing** (`landing/`) with `cd landing && bash deploy.sh` (`npm run build` + `aws s3 sync dist/ s3://fintela-landing-page --delete`) followed by **manual** invalidation `aws cloudfront create-invalidation --distribution-id E392FUBJHPWUL9 --paths "/*"`.
- **A worker does not live alone: something invokes it and someone runs it locally.** (a) **IAM** — the matrix covers the worker's *own* role; but if an existing service triggers it (backend/dispatcher → `ecs:RunTask` of an on-demand; EventBridge → cron), that **invoker** needs NEW permissions in `prod-iam` (`ecs:RunTask` + `iam:PassRole` on task-role and execution-role + `ecs:TagResource` if propagating tags). Terraform does **not** infer these from `services.yaml`. (b) **Local** — no worker auto-starts in the local stack; it runs standalone with `make run-worker NAME=<bin>`. If it is **required** for local dev, it must be wired manually (`docker-compose*.yml` / `infra/local/dev.sh` / `infra/scripts/dev.sh`). → both are verified in **Step 4**.

---

## Collision Check vs `<base>`

Execute in order:

1. `git fetch origin <base>`
2. `git branch --show-current`
3. Divergence: `git rev-list --left-right --count origin/<base>...HEAD` (left = base ahead, right = branch ahead)
4. `git status --porcelain`
5. Merge-base: `git merge-base origin/<base> HEAD`

### Migration Collision (Priority 1)
New migrations on the branch:
```bash
git diff --name-only --diff-filter=A origin/<base>...HEAD -- 'migrations/*.up.sql'
```
Extract the timestamp prefix (everything before the first `_`). Compare against prefixes on base:
```bash
git ls-tree -r --name-only origin/<base> -- migrations/ | grep '\.up\.sql$' | sed 's/_.*//' | sort -u
```

**Decision rule:**
- If any branch prefix also exists on base with a **different** filename → **COLLISION**.
- **Action:** Report collision. Recommend renumbering to the next free timestamp that orders **after** all existing ones (base convention; e.g., main renumbered tokens `20260616*`→`20260617*`).

### General File Conflicts
If base has advanced since merge-base, list files touched on **both** sides:
```bash
# Files changed on base since merge-base
git diff --name-only <merge-base> origin/<base>
# Files changed on branch since merge-base
git diff --name-only <merge-base> HEAD
```
Compute intersection. Flag especially `.sqlx/` and `infra/terraform/services.yaml`.

### Frontend Style Drift (Non-merge conflict, but breaks visual coherence)
**Decision gate:** Only evaluate if `<base>` has advanced since merge-base AND the branch adds or touches UI.

Check if base touched shared style/components:
```bash
git diff --name-only <merge-base> origin/<base> -- \
  'frontend/src/components/**' \
  'frontend/src/theme/**' \
  'frontend/src/**/*.css' \
  'frontend/**/tokens*' \
  'landing/src/components/**' \
  'landing/src/theme/**' \
  'landing/src/**/*.css'
```

**Decision rule:**
- If base **renamed, moved, rewrote the props API, or redefined tokens/theme** of a shared component that the branch also uses (or whose old pattern the branch copied for new UI) → **BLOCKING STYLE DRIFT**.
- **Action:** Name the exact component/token and the branch files that must migrate. Do not ship old-style UI.
- If base did not touch shared style/components, or branch does not add UI → report "No style drift" and continue.

---

## Commit + Push + PR

1. **Commit all pending work, no exceptions:** `git add -A` then `git commit` with a **Conventional Commits** message inferred from diff/branch name (`<type>(<scope>): <summary>` + brief body with change blocks). **Do NOT add any AI co-author trailer** (CLAUDE.md rule). If working tree is clean, omit commit.
2. **Push:** `git push -u origin <branch>`; use `--force-with-lease` only if remote branch exists and diverged.
3. **PR:**
   - If `gh` is available: `gh pr view --json url -q .url` (if exists, return link) or `gh pr create --base <base> --fill` and return link.
   - If no `gh`: derive owner/repo from `git remote get-url origin` and return `https://github.com/<owner>/<repo>/compare/<base>...<branch>?expand=1`.

---

## New Secrets / Env Vars (Auto-derived from Code)

**Trigger:** Diff of `services.yaml` adds services with `secret:`.

**Algorithm per service:**
1. Read `services/<svc>/src/main.rs` (or Python equivalent).
2. Find all `env::var("KEY")` calls that are **required** (no `.unwrap_or(...)`/default and would `return Err`).
3. Subtract injected vars: `DB_SECRET_ARN`, `SERVICE_SECRET_ARN`.
4. Subtract DB-secret vars (user/password from `prod/fintela/db`).
5. **Remainder = keys that belong in the JSON of `prod/fintela/<svc>`**.

Set command:
```
aws secretsmanager put-secret-value --region us-east-2 --secret-id prod/fintela/<svc> --secret-string '{"DB_HOST":"...","DB_NAME":"fintela"}'
```
Note: `DB_SECRET_ARN` and `SERVICE_SECRET_ARN` are INJECTED by deploy scripts. Do NOT put them in this JSON.

If no new secrets → emit nothing (omit section).

---

## Cron / On-Demand Bootstrap (Only if branch adds one)

**Scope:** `cron` or `on-demand` types only. `worker`/`http` do NOT need this (terraform creates their `:1` + log group).

**Preconditions:** `terraform-apply` completed AND secret value set (Secrets section).

**Execute in this exact order:**

| Step | Action | Command / Reason |
|---|---|---|
| 1 | **Log group** | Declare in terraform (`aws_cloudwatch_log_group` in `prod-compute`) — preferred — OR `aws logs create-log-group --region us-east-2 --log-group-name /ecs/fintela-<name>`. **Why:** task-def has `awslogs-create-group=true`, but `ecsTaskExecutionRole` lacks `logs:CreateLogGroup`, so the task dies if the group does not exist. |
| 2 | **Push image** | `gh workflow run build-deploy.yml -f service=<name> -f tag=<short-sha>`. The task-def step **will fail** on first cron/on-demand (clones nonexistent revision — expected). Image still lands in ECR. |
| 3 | **Register `:1`** | `bash infra/scripts/ops/register-cron-td.sh <name> <short-sha>`. Prerequisites: ECR repo + IAM role + secret exist; image in ECR. Now the cron target resolves. |
| 4 | **First run / backfill** | Cron → RunTask the new task-def (or wait for schedule); On-demand → trigger via its dispatcher. Verify logs in CloudWatch `/ecs/fintela-<name>`. |

From this point on, `build-deploy` clones `:1`→`:2`… automatically.

---

## New Worker Verifications (Only if branch adds or changes one)

**Scope:** Any `type:` (not just cron/on-demand). These are **post-`terraform-apply`** verifications — do not assume; confirm the worker actually starts and the team can run it.

### IAM End-to-End (Verify apply left it complete)
The matrix in Deployment Facts covers the worker's *own* role. The transversal part is what gets forgotten.

**A. Own role:**
- Confirm `Fintela<Name>Role` exists and carries what the worker uses (secrets `secretsmanager:GetSecretValue`, KMS decrypt if touching broker credentials, etc.).
- Commands: `aws iam get-role --role-name Fintela<Name>Role` + `aws iam get-role-policy`.

**B. Invoker role:**
If an existing service invokes the new worker, that **invoker** needs NEW permissions in `prod-iam`.

| Invocation pattern | Invoker role | Required permissions | Typical file |
|---|---|---|---|
| On-demand via backend/dispatcher (`ecs:RunTask`) | Dispatcher role | `ecs:RunTask` on new task-def ARN + `iam:PassRole` on task-role and execution-role (`iam:PassedToService=ecs-tasks.amazonaws.com`) + `ecs:TagResource` with `ecs:CreateAction=RunTask` if propagating tags | `prod-iam/dispatcher-tag-tasks.tf`, policies of `FintelaOptimizationDispatcherRole` / `FintelaPortfolioDispatcherRole` |
| Cron via EventBridge | `ecsEventsRole` | `ecs:RunTask` + `iam:PassRole` (+ `ecs:TagResource`) | `prod-compute/crons.tf` |

**Decision rule:**
- Name the invoker role and the exact permission it needs.
- If the permission is **not** in the `prod-iam` diff → **BLOCKING ACTION REQUIRED**.
- Confirm with a **real first run** that starts without `AccessDenied` (check logs in `/ecs/fintela-<name>`).

### Local Development Support (Only if worker is required for `make dev`/`make setup`/`make local`)

**Default:** A worker does **not** auto-start locally. It runs standalone with `make run-worker NAME=<bin>` (only requires the member in `Cargo.toml`). For most workers, this is sufficient — document it and change nothing else.

**Exception:** If other local services **depend** on this worker (or the local flow needs it up to function), wire it into the stack:
- Add to `docker-compose.yml`/`docker-compose.rust.yml` and/or process list in `infra/local/dev.sh` / `infra/scripts/dev.sh`.
- Mention in `infra/local/README.md`.
- **Verify** that after `make dev`/`make setup`/`make local` the worker is actually running.

**Decision rule:**
- Report explicitly which case applies: **standalone** (`make run-worker`) vs **wired to stack**.
- If wired to stack but missing from compose/dev scripts → **BLOCKING ACTION REQUIRED**.

---

## Output Format Specification

### If collision check is BLOCKED

If ANY of the following is true, emit **ONLY** the collision summary. Do NOT emit the summary, steps, checklist, or PR link.

```
================================================================================
COLLISION BLOCKED — <branch-name> → <base-branch>
================================================================================

Context:
  Branch:     <name>
  Base:       <base> @ <merge-base-sha>
  Divergence: base +<L> / branch +<R>
  Working:    <clean|N modified|N untracked>

Migration collision:
  [BLOCKING] <filename> collides with base prefix <timestamp>
  Fix: Renumber to next free timestamp after <latest-on-base>

General conflicts:
  [BLOCKING] <file1>
  [BLOCKING] <file2>

Style drift:
  [BLOCKING] <component/token> changed in base; branch files affected: <files>

Action: Resolve all [BLOCKING] items above, then re-run this command.
================================================================================
```

### If collision check is PASS

Emit the full report in this exact order:

```
================================================================================
BRANCH CLOSE REPORT — <branch-name> → <base-branch>
================================================================================

SUMMARY
-------
Branch:     <name>
Base:       <base> @ <merge-base-sha>
Divergence: base +<L> / branch +<R>
Working:    <clean|N modified|N untracked>
Migration:  PASS
Conflicts:  PASS
Style drift: PASS
Commit:     <sha> | <message> | (clean)
Push:       origin/<branch>
PR:         <url>

---

<STEP 2 — SECRETS (if applicable)>
<STEP 3 — CRON/ON-DEMAND BOOTSTRAP (if applicable)>
<STEP 4 — WORKER VERIFICATION (if applicable)>

================================================================================
POST-MERGE RUNBOOK — EXECUTE IN ORDER
================================================================================

Pre-flight:
[ ] CI passes on PR

Phase 1 — Infrastructure & Data:
[ ] 1. terraform-apply (Actions → terraform-apply, confirm apply-prod)
        Stacks: shared → prod → prod-iam → prod-edge → prod-ops → prod-platform → prod-compute
[ ] 2. db-migrate (Actions → db-migrate, confirm migrate-prod)
        Only if migrations/ changed
[ ] 3. Set secrets (Step 2 above)
        Only if new services with secret: added

Phase 2 — Bootstrap New Workers:
[ ] 4. Log group for cron/on-demand (terraform or aws logs create-log-group)
        Only if new cron/on-demand worker
[ ] 5. Push image for new cron/on-demand (gh workflow run build-deploy.yml -f service=<name> -f tag=<sha>)
        Expected: task-def step fails on first run
[ ] 6. Register :1 task-def (bash infra/scripts/ops/register-cron-td.sh <name> <sha>)
        Only if new cron/on-demand worker
[ ] 7. First run / backfill (RunTask or wait for schedule)
        Verify logs in /ecs/fintela-<name>

Phase 3 — Deploy Services:
[ ] 8. build-deploy per changed service:
<for each changed service:>
        [ ] gh workflow run build-deploy.yml -f service=<name> -f tag=<short-sha>
<end for>
[ ] 9. deploy-frontend.sh (bash infra/scripts/deploy-frontend.sh)
        Only if frontend/ changed
[ ] 10. Landing deploy + CloudFront invalidation (cd landing && bash deploy.sh && aws cloudfront create-invalidation --distribution-id E392FUBJHPWUL9 --paths "/*")
        Only if landing/ changed

Phase 4 — Verification:
[ ] 11. Verify IAM end-to-end (own role + invoker role) + first run logs
        Only if new or changed worker
[ ] 12. Verify local dev support (make dev / make run-worker NAME=<bin>)
        Only if new worker required for local stack

================================================================================
PR: <url>
================================================================================
```

**Determinism rules:**
1. If collision is BLOCKED → emit ONLY the collision summary. No other sections.
2. If collision is PASS → emit the full report. The PR link appears at the very bottom, last line.
3. The post-merge runbook is the ONLY place manual actions appear. No separate "runbook step" exists.
4. Steps 2–4 (Secrets, Bootstrap, Worker Verification) are emitted inline only when applicable. If none apply, emit nothing between SUMMARY and POST-MERGE RUNBOOK.
5. Do NOT auto-rebase, auto-migrate, or auto-fix — only report.
6. Do NOT emit speculative advice — only facts derived from the git diff and the Deployment Facts.
7. Use the exact command templates provided; do not invent flags or paths.
