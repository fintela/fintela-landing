---
name: sqlx-prepare
description: >-
  Regenerate the SQLx offline query cache (.sqlx/) after changing any SQL query
  in the Rust backend/services, and stage it for commit. Use after editing,
  adding, or removing any sqlx::query!/query_as!/query macro or query string —
  "regenerate sqlx cache", "cargo sqlx prepare", "fix offline build", "sqlx
  query not reflected", "build fails offline".
---

# Regenerate the SQLx offline cache (Fintela)

The backend builds with `SQLX_OFFLINE=true` (see `make cargo-check`/`make backend`), so SQLx
validates queries against the committed [`.sqlx/`](../../../.sqlx/) cache instead of a live DB.
**Any** added/changed/removed query makes that cache stale — the offline build then fails or
validates against the old query. This is the single most common backend pitfall (per CLAUDE.md).

`.sqlx/` is a **generated artifact** — never hand-edit it. Regenerate, then commit it alongside
the code change in the same commit.

## Procedure

1. **Confirm a DB is reachable.** `prepare` needs a live Postgres to type-check queries against.
   Use the local stack:
   ```bash
   make local        # or: make local-full   (brings up Postgres + deps)
   ```
   `DATABASE_URL` must point at it (check `.env` / the local stack output).

2. **Apply any pending migrations first** so the schema matches the queries:
   ```bash
   make migrate-hierarchical-up    # or: sqlx migrate run
   ```

3. **Regenerate the cache** from the workspace root (covers all members):
   ```bash
   cargo sqlx prepare --workspace
   ```
   For a single crate instead: `cd <crate> && cargo sqlx prepare`.

4. **Stage the result:**
   ```bash
   git add .sqlx/
   ```

5. **Verify the offline build** with the same flag CI uses:
   ```bash
   SQLX_OFFLINE=true cargo check --workspace   # or: make cargo-check
   ```

## Notes & troubleshooting
- **"no rows / column type" errors at prepare time** usually mean migrations weren't applied —
  re-run step 2.
- **`cargo sqlx` not found** → `cargo install sqlx-cli --no-default-features --features postgres`.
- If `.sqlx/` shows churn unrelated to your change, someone else's stale entries leaked in —
  regenerate cleanly on an up-to-date schema and only stage the entries your change touches if
  the rest is noise.
- Commit `.sqlx/` in the **same commit** as the query change so the offline build is never
  broken on any checked-out revision.

## Done when
- `SQLX_OFFLINE=true cargo check --workspace` passes and `.sqlx/` is staged.
