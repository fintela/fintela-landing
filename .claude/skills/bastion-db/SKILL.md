---
name: bastion-db
description: >-
  Connect to the PRODUCTION database (private Aurora/RDS, not publicly
  reachable) by running commands on the in-VPC bastion via AWS SSM
  Send-Command — no SSH, no open inbound ports. Use to run read-only prod SQL
  diagnostics, inspect prod data, check migration state, or (only with explicit
  user confirmation) apply migrations / writes. Also covers the interactive
  route (SSM port-forwarding to attach a local psql/GUI client). Triggers:
  "query prod db", "connect to the bastion", "check prod data", "run this SQL
  on prod", "port-forward to prod", "tunnel to the database", "diagnose <thing>
  in production".
---

# bastion-db — query the prod database through the SSM bastion

The prod database is a **private Aurora cluster** (`fintela-db-instance-1.<...>.us-east-2.rds.amazonaws.com`, db `fintela`) with **no public access**. You reach it by running commands **on the bastion EC2 host inside the VPC**, via `aws ssm send-command`. This mirrors what `.github/workflows/db-migrate.yml` does.

## HARD RULES (read first)

1. **ALWAYS ask the user for permission before connecting to prod or running ANY query.** State exactly what you'll run. This is production data and real money.
2. **Read-only by default.** Only run `SELECT`/`EXPLAIN`/`\d`-style inspection unless the user explicitly confirms a specific write/migration. Never run `UPDATE`/`DELETE`/`DROP`/`ALTER`/`INSERT` without an explicit, specific go-ahead.
3. **Leave the bastion as you found it.** Check its state first; if you had to **start** it, **stop** it when done. If it was already running, leave it running.
4. Prefer one well-formed query batch over many round-trips (each send-command is a separate in-VPC execution).

## Facts (codified in infra)

| Thing | Value |
|---|---|
| AWS account | `176977333677` |
| Region | `us-east-2` |
| Bastion instance | `i-031f5a62d0673fada` (Name `bastion`, `t3.medium`, **normally STOPPED**) |
| SSM document | `AWS-RunShellScript` |
| Bastion SG | `sg-0e7eb4a53f266ed07` (SSH/app IP whitelisting via `infra/scripts/update-sg-ip.sh`) |
| DB URL on bastion | `DATABASE_URL` in **`/home/ec2-user/.env`** (ec2-user HOME, NOT `~/fintela/.env`). `psql` is at `/usr/bin/psql` (postgresql16). The login shell does NOT export `DATABASE_URL` — you must `. /home/ec2-user/.env`. |
| IAM | GHA role `gha-deploy-fintela` has `ec2:Start/Stop/DescribeInstances` + `ssm:SendCommand/GetCommandInvocation` on the bastion. A personal user may also have it — verify read-only with `iam simulate-principal-policy` (see Tips). |

Source of truth: `infra/terraform/live/prod-ops/bastion_ssm.tf`, `.github/workflows/db-migrate.yml`.

## send-command vs start-session

Both work. Pick by who is driving.

| | `aws ssm send-command` | `aws ssm start-session` |
|---|---|---|
| Needs `session-manager-plugin` | No | **Yes** |
| Shape | Fire a shell snippet, poll, read captured stdout | Live bidirectional stream (shell or TCP tunnel) |
| Good for | **Agent-driven work** — every step is a discrete, auditable, capturable call | **A human at a terminal** — interactive psql, DBeaver/TablePlus, schema browsing |

**Default to `send-command` for anything Claude runs.** Its output is captured and reproducible; a streamed interactive session is not something an agent can drive reliably.

`session-manager-plugin` **is installed locally** (v1.2.835.0, installed 2026-08-02, `/usr/local/bin/session-manager-plugin`), so the interactive route below is available when the user wants to drive it themselves.

## Procedure

### 0. Confirm reachability (read-only, safe)
```bash
aws ec2 describe-instances --region us-east-2 --instance-ids i-031f5a62d0673fada \
  --query 'Reservations[0].Instances[0].State.Name' --output text
```
If `stopped`, start it and wait for SSM (and remember to stop it after):
```bash
aws ec2 start-instances --region us-east-2 --instance-ids i-031f5a62d0673fada >/dev/null
aws ec2 wait instance-running --region us-east-2 --instance-ids i-031f5a62d0673fada
# wait for the SSM agent to register (PingStatus=Online), up to ~5 min
for i in $(seq 1 30); do
  P=$(aws ssm describe-instance-information --region us-east-2 \
    --filters "Key=InstanceIds,Values=i-031f5a62d0673fada" \
    --query 'InstanceInformationList[0].PingStatus' --output text 2>/dev/null || echo None)
  [ "$P" = Online ] && { echo "SSM online"; break; }
  sleep 10
done
```

### 1. Run SQL on the bastion (read-only example)
Use a login shell as `ec2-user` and source `/home/ec2-user/.env` so `DATABASE_URL` is in scope (the login shell does NOT export it):
```bash
SQL='SELECT count(*) FROM developers.basket_operations;'   # your read-only query
# Build the remote command: source the env, run psql with tuples-only/unaligned for clean output.
REMOTE="sudo -u ec2-user bash -lc 'set -a && . /home/ec2-user/.env && set +a && psql \"\$DATABASE_URL\" -X -A -F $'\''\t'\'' -P pager=off -c \"$SQL\"'"
jq -n --arg c "$REMOTE" '{commands:[$c]}' > /tmp/ssm-params.json
CID=$(aws ssm send-command --region us-east-2 --instance-ids i-031f5a62d0673fada \
  --document-name AWS-RunShellScript --comment "prod read-only diagnostic" \
  --parameters file:///tmp/ssm-params.json --query 'Command.CommandId' --output text)
```

### 2. Poll to a terminal state and read output
```bash
for i in $(seq 1 60); do
  ST=$(aws ssm get-command-invocation --region us-east-2 --command-id "$CID" \
    --instance-id i-031f5a62d0673fada --query 'Status' --output text 2>/dev/null || echo Pending)
  case "$ST" in Success|Failed|Cancelled|TimedOut) break ;; esac
  sleep 5
done
aws ssm get-command-invocation --region us-east-2 --command-id "$CID" \
  --instance-id i-031f5a62d0673fada \
  --query '{status:Status,out:StandardOutputContent,err:StandardErrorContent}' --output json
```

### 3. Cleanup (only if YOU started it)
Once the invocation has reached a terminal state and you've read its output:
```bash
aws ec2 stop-instances --region us-east-2 --instance-ids i-031f5a62d0673fada >/dev/null
```

## Interactive route: SSM port-forwarding (human-driven)

For hands-on work — `psql` with autocomplete/history, DBeaver, TablePlus — tunnel the private Aurora to a local port. **Requires `session-manager-plugin`** (installed). Steps 0 and 3 above still apply: start the bastion first, stop it after.

Endpoints (resolve dynamically rather than hardcoding — they survive failover):
```bash
aws rds describe-db-clusters --region us-east-2 --db-cluster-identifier fintela-db \
  --query 'DBClusters[0].{Writer:Endpoint,Reader:ReaderEndpoint}' --output json
```
- Writer: `fintela-db.cluster-c38mqc6kgobq.us-east-2.rds.amazonaws.com`
- Reader: `fintela-db.cluster-ro-c38mqc6kgobq.us-east-2.rds.amazonaws.com` ← **prefer this for diagnostics**, it keeps load off the writer
- Keycloak's DB is a separate instance: `fintela-keycloak-db.c38mqc6kgobq.us-east-2.rds.amazonaws.com`

Open the tunnel (blocks — leave it in its own terminal):
```bash
aws ssm start-session --region us-east-2 --target i-031f5a62d0673fada \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["fintela-db.cluster-ro-c38mqc6kgobq.us-east-2.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["5555"]}'
```

Then from any other terminal it behaves like a local database. Pull the credentials out of the bastion's `.env` via one `send-command` first (steps 1–2), or read them from Secrets Manager:
```bash
psql "postgresql://<user>:<pass>@localhost:5555/fintela"
```

A plain interactive shell on the bastion, if you need one:
```bash
aws ssm start-session --region us-east-2 --target i-031f5a62d0673fada
```

**Claude should not drive this route** — the session is a live stream with no capturable stdout. Hand the commands to the user to run themselves (with the `!` prefix), and go back to `send-command` for anything that needs a recorded result.

## Tips
- Quoting through `send-command` → `bash -lc` → `psql -c "..."` is the tricky part. For complex/multi-statement SQL, write the SQL to a file on the bastion via a heredoc in the remote command and run `psql -f`, or base64-encode the SQL and decode on the bastion to avoid quote hell.
- `psql -X -A -F $'\t' -P pager=off` gives clean, machine-readable tuples (no `.psqlrc` noise, no pager, tab-separated).
- For migrations/writes the canonical path is the **db-migrate.yml** GitHub Action (or `cargo sqlx migrate` on the bastion) — prefer that over ad-hoc writes, and only with explicit user confirmation.
- If `/home/ec2-user/.env` lacks `DATABASE_URL`, fall back to the host/creds the user provides, or fetch from Secrets Manager / the ECS task definition (with permission).
- To check whether the current principal actually has the needed permissions **without touching anything**, simulate the policy:
  ```bash
  aws iam simulate-principal-policy --region us-east-2 \
    --policy-source-arn "$(aws sts get-caller-identity --query Arn --output text)" \
    --action-names ssm:SendCommand ssm:StartSession ec2:StartInstances ec2:StopInstances \
    --resource-arns arn:aws:ec2:us-east-2:176977333677:instance/i-031f5a62d0673fada \
    --query 'EvaluationResults[].{Action:EvalActionName,Decision:EvalDecision}' --output table
  ```
  Cheaper and safer than discovering an `AccessDenied` halfway through a prod procedure. (Note: `simulate-principal-policy` only accepts a user/role ARN, not an assumed-role session ARN — strip the session suffix if you're on temporary credentials.)
