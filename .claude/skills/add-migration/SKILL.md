---
name: add-migration
description: >-
  Create a paired SQLx migration (timestamped <ts>_<name>.up.sql + .down.sql)
  in migrations/, then regenerate the SQLx offline cache. Use when adding or
  changing the database schema — "add a migration", "new table", "alter column",
  "schema change", "create index", "add a DB column".
---

# Add a database migration (Fintela)

Migrations live flat in [`migrations/`](../../../migrations/) as **paired** files:
`<timestamp>_<name>.up.sql` and `<timestamp>_<name>.down.sql`. Applied with SQLx
(`sqlx migrate run` / `make migrate-hierarchical-up`). Every `up` MUST have a matching `down`
that cleanly reverses it — never orphan a down.

## Conventions (match existing migrations)
- **Timestamp:** `YYYYMMDDHHMMSS` (e.g. `20260607143205`). Generate with `date +%Y%m%d%H%M%S`.
  Some legacy migrations use `YYYYMMDD000001` sequence form — either sorts correctly; prefer the
  full timestamp for new ones. It must sort **after** every existing migration.
- **Schema:** application tables live in the `developers.` schema (e.g.
  `developers.activity_log`, `developers.organizations`).
- **Org scoping:** tenant tables carry `organization_id UUID NOT NULL REFERENCES
  developers.organizations(id) ON DELETE CASCADE` and an index leading with `organization_id`.
- **Wrap in a transaction:** `BEGIN; … COMMIT;` in both files.
- **Comment the intent** at the top of `up` and add `COMMENT ON TABLE …` for new tables.

## Procedure

1. Pick a name (snake_case, e.g. `add_strategy_archived_flag`) and generate the timestamp:
   ```bash
   date +%Y%m%d%H%M%S
   ```
2. Create both files:
   - `migrations/<ts>_<name>.up.sql`
   - `migrations/<ts>_<name>.down.sql`
3. Write the forward change in `up`, the exact reversal in `down`.
4. **Apply locally** against the running stack (start it with `make local` if needed):
   ```bash
   make migrate-hierarchical-up      # or: sqlx migrate run
   ```
5. If any Rust query touches the new schema, run the **sqlx-prepare** skill
   (`cargo sqlx prepare --workspace`) and stage `.sqlx/`.
6. **Test the down too** — a migration whose `down` doesn't reverse is a latent outage:
   ```bash
   make migrate-hierarchical-down    # or: sqlx migrate revert   (then re-apply step 4)
   ```

## Templates

`<ts>_<name>.up.sql`
```sql
-- One-line statement of intent. Why this change exists / who reads it.
BEGIN;

CREATE TABLE developers.<table> (
    id              BIGSERIAL    PRIMARY KEY,
    organization_id UUID         NOT NULL REFERENCES developers.organizations(id) ON DELETE CASCADE,
    name            TEXT         NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_<table>_org_time
    ON developers.<table> (organization_id, created_at DESC);

COMMENT ON TABLE developers.<table> IS '…';

COMMIT;
```

`<ts>_<name>.down.sql`
```sql
BEGIN;

DROP TABLE IF EXISTS developers.<table>;

COMMIT;
```

For an `ALTER`, the down should `DROP`/restore the prior state exactly (e.g.
`ALTER TABLE … ADD COLUMN` ↔ `ALTER TABLE … DROP COLUMN`).

## Reference
Clean paired example:
[`migrations/20260607000001_activity_log.up.sql`](../../../migrations/20260607000001_activity_log.up.sql)
/ `.down.sql`.

## Done when
- Both files exist with sortable timestamps, `up` applies and `down` reverts cleanly, and any
  affected SQLx queries have a regenerated `.sqlx/` (commit it in the same commit).
