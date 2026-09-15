# Worktrees and ports

Four projects on this machine hand out local ports, and a fifth mistake is
always available: hardcoding one. This is how the landing's allocator works and
which of its rules are load-bearing. It is the fintela-internal script with the
database, the tunnel and the secrets removed — a static site needs none of them.

```bash
./setup_worktree.sh <name> [--product <wt>|--api <url>]   # from main
make ports                    # what this worktree got
make dev                      # the site on its port (npm ci first if needed)
make check                    # what CI runs
make nuke                     # BEFORE `git worktree remove`
```

---

## 1 · Why every symbol is `lwt_`

Three allocators already exist here — product (`wt_`, base 20000), proasis
(`wt_`, base 12000) and fintela-internal (`iwt_`, base 11500) — and the first
two share the same function names *and* the same "return early if already
sourced" guard. A fourth library reusing any of those prefixes would either do
nothing (you silently keep the other project's functions) or rebind its port
base and hand out a port belonging to another project's running stack. Hence
`lwt_` / `LWT_`, and a guard variable `_LANDING_WORKTREE_LIB`.

The registry lives in `~/.fintela-landing/worktrees/<slug>.env`, a different
directory from the other three so the `flock` files can never contend. Outside
every repo, so it survives `git clean` and is visible to every worktree at once.

## 2 · The four ranges, and the assertion that keeps them apart

| Allocator | Range | Block | Slots |
|---|---|---|---|
| fintela (product) | 20000–39999 | 100 | 200 |
| proasis | 12000–19999 | 100 | 80 |
| fintela-internal | 11500–11999 | 10 | 50 |
| **fintela-landing** | **11000–11499** | **10** | **50** |

`lwt_validate_range` runs **at source time** and asserts three things: the base
is not privileged, the ceiling is below 11500 (fintela-internal's floor), and
below 32768 (the ephemeral range). A worktree gets a **slot** and therefore a
base of `11000 + slot × 10`; the tens digit names the worktree, the unit names
the process (`infra/local/lib/ports.map`: `web` = 0, `web-preview` = 1).

The allocator **checks, it does not count**: a slot is taken only when every
port in its block is free against both the kernel (`ss -ltn`) and the registry —
a port can be reserved with nothing listening.

## 3 · What gets generated, and which Vite file gets what

| File | Contents | Why there |
|---|---|---|
| `.local/ports.env` | slot, base, every port, `VITE_FINTELA_API` | sourced by the Makefile and `infra/local/*.sh`; clobbered on every render |
| `.env.local` (managed block) | `WEB_PORT`, `WEB_PREVIEW_PORT` | Vite reads `.env.local` in **every** mode, so both `npm run dev` and `npm run preview` get their port. Not `VITE_`-prefixed → `loadEnv(mode, cwd, '')` in `vite.config.ts` sees them, the bundle never does. |
| `.env.development.local` (managed block) | `VITE_FINTELA_API` | Read **only** in development mode, and highest precedence there. A localhost URL here cannot reach `npm run build` output — the same rule the product frontend uses. |

Only the block between the markers is rewritten; anything outside survives.
`deploy.sh` sources `.env.local` for `S3_BUCKET` / `CLOUDFRONT_DISTRIBUTION`,
which therefore live in its tail.

## 4 · The contact form and the product backend

The form on `/contact` POSTs to `${VITE_FINTELA_API}/contact` — the product
backend. In development that must be a **local** backend, so `setup_worktree.sh`
resolves the URL from the product's own registry: `--product <name>` (default
`main`) reads `WT_PORT_BACKEND_PORT` from `~/.fintela/worktrees/<name>.env`, the
file the product's `make ports` reads, so the two can never disagree. `--api
<url>` overrides; `--no-api` leaves it unset.

**Unset means the form fails visibly on submit.** That is deliberate: the
alternative — falling back to `https://backend.fintela.io` in dev — would file a
real request with production, and email real staff, every time somebody tested
the form locally. `npm run preview` serves a *production* bundle and therefore
does talk to the real backend; treat it as such.

The choice is remembered in the registry, so `./setup_worktree.sh --reconfigure`
keeps it; pass the flag again to change it.

## 5 · Teardown

`make nuke` stops whatever listens on this worktree's ports (the dev server
runs in the foreground with no pidfile, so the port is the only durable handle),
removes `.local/` and the managed blocks, and frees the slot. Then
`git worktree remove <name>`. `node_modules` and `dist` are left alone.
`--prune` drops registry entries whose directory is gone.
