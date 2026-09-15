#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# worktree.sh — per-worktree local-environment library (fintela-landing).
#
# Sourced by setup_worktree.sh and infra/local/{dev,nuke}.sh. Never executed
# directly.
#
# What it owns:
#   • the slug (worktree identity) and the names derived from it
#   • the port registry under ~/.fintela-landing/worktrees/ and the allocator
#   • rendering the generated config (.env.local, .env.development.local,
#     .local/ports.env)
#
# ─── WHY EVERY SYMBOL IS PREFIXED lwt_ / LWT_ ────────────────────────────────
# This machine already has THREE worktree allocators. Two of them define
# `wt_slug`, `wt_die`, `wt_port`, `WT_SLUG`, `WT_PORT_BASE`, `WT_BLOCK_SIZE`
# and share the same "return early if already sourced" guard; the third
# (fintela-internal) took `iwt_` for exactly the reason below:
#
#   ~/fintela/product/main/infra/local/lib/worktree.sh                (wt_,  base 20000)
#   ~/montania-analitica/proasis-app/main/infra/local/lib/worktree.sh (wt_,  base 12000)
#   ~/fintela/internal/main/infra/local/lib/worktree.sh               (iwt_, base 11500)
#
# A fourth library reusing any of those prefixes would either do NOTHING (the
# other project's guard variable is already set, so you silently keep ITS
# functions) or rebind ITS port base and hand out a port belonging to another
# project's running stack. Both failures are silent. Hence lwt_.
#
# Design notes: docs/LOCAL_WORKTREES.md
# ─────────────────────────────────────────────────────────────────────────────

# Guard against double-sourcing. Deliberately NOT named like the other three.
[ -n "${_LANDING_WORKTREE_LIB:-}" ] && return 0
_LANDING_WORKTREE_LIB=1

# ─── Output helpers ──────────────────────────────────────────────────────────
if [ -t 1 ]; then
  _C_RED=$'\033[0;31m'; _C_GRN=$'\033[0;32m'; _C_YLW=$'\033[0;33m'
  _C_BLU=$'\033[0;34m'; _C_DIM=$'\033[2m';   _C_OFF=$'\033[0m'
else
  _C_RED=; _C_GRN=; _C_YLW=; _C_BLU=; _C_DIM=; _C_OFF=
fi

lwt_log()  { printf '%s▶%s %s\n' "$_C_BLU" "$_C_OFF" "$*"; }
lwt_ok()   { printf '%s✓%s %s\n' "$_C_GRN" "$_C_OFF" "$*"; }
lwt_warn() { printf '%s⚠%s %s\n' "$_C_YLW" "$_C_OFF" "$*" >&2; }
lwt_err()  { printf '%s✗%s %s\n' "$_C_RED" "$_C_OFF" "$*" >&2; }
lwt_dim()  { printf '%s  %s%s\n' "$_C_DIM" "$*" "$_C_OFF"; }
lwt_die()  { lwt_err "$*"; exit 1; }

# ─── Paths and constants ─────────────────────────────────────────────────────

# The cross-worktree registry. Outside every repo on purpose: it must survive
# `git clean`, must never be committed, and must be visible to every worktree at
# once. A DIFFERENT directory from ~/.fintela and ~/.fintela-internal, so the
# flock files are different inodes and can never contend.
LANDING_HOME="${LANDING_HOME:-$HOME/.fintela-landing}"
LWT_REGISTRY_DIR="$LANDING_HOME/worktrees"
LWT_LOCK_FILE="$LANDING_HOME/registry.lock"

# First port of the FIRST worktree's block. See the rationale block in
# infra/local/lib/ports.map: 11000-11499, below fintela-internal (11500),
# proasis (12000) and fintela (20000), and below the ephemeral floor (32768).
LANDING_PORT_BASE="${LANDING_PORT_BASE:-11000}"
LWT_BLOCK_SIZE=10
LWT_MAX_SLOT=49

# Where the product repo's worktree registry lives. The contact form talks to
# the product backend, so a landing worktree points VITE_FINTELA_API at ONE
# product worktree's backend port, read from that registry (never hardcoded).
FINTELA_HOME="${FINTELA_HOME:-$HOME/.fintela}"
LWT_PRODUCT_REGISTRY_DIR="$FINTELA_HOME/worktrees"

# Marker lines delimiting the generated block inside the env files. Everything
# OUTSIDE the markers is yours and is preserved across re-renders.
LWT_BLOCK_BEGIN='# ─── BEGIN fintela-landing worktree config — generated, do not edit ───'
LWT_BLOCK_END='# ─── END fintela-landing worktree config ───'

# ─── Range assertion ─────────────────────────────────────────────────────────
# Runs at load time, like fintela-internal's: the base is not privileged, the
# ceiling stays below the next allocator's floor (fintela-internal at 11500),
# and below the ephemeral range.
lwt_validate_range() {
  local top=$(( LANDING_PORT_BASE + (LWT_MAX_SLOT + 1) * LWT_BLOCK_SIZE - 1 ))
  case "$LANDING_PORT_BASE" in
    ''|*[!0-9]*) lwt_die "LANDING_PORT_BASE is not a number: '$LANDING_PORT_BASE'" ;;
  esac
  [ "$LANDING_PORT_BASE" -ge 1024 ] \
    || lwt_die "LANDING_PORT_BASE=$LANDING_PORT_BASE falls in the privileged ports"
  [ "$top" -lt 11500 ] \
    || lwt_die "the port envelope reaches $top, which enters fintela-internal's range (11500-11999).
  Lower LANDING_PORT_BASE or LWT_MAX_SLOT — see infra/local/lib/ports.map."
  [ "$top" -lt 32768 ] \
    || lwt_die "the port envelope reaches $top, which enters the ephemeral range (32768+)."
}
lwt_validate_range

# ─── Identity ────────────────────────────────────────────────────────────────

# Absolute path of the repo root containing $1 (default: cwd).
lwt_repo_root() {
  git -C "${1:-$PWD}" rev-parse --show-toplevel 2>/dev/null
}

# Slug for a worktree path: the directory basename, lowercased, with anything
# that is not [a-z0-9] collapsed to a single '-'.
lwt_slug() {
  local base
  base="$(basename "${1:?lwt_slug needs a path}")"
  printf '%s' "$base" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//'
}

lwt_project_name() { printf 'fintela-landing-%s' "$1"; }

# ─── The port map ────────────────────────────────────────────────────────────

LWT_PORT_KEYS=()
LWT_PORT_OFFSETS=()
LWT_PORT_VARS=()
LWT_PORT_LABELS=()

lwt_ports_map_path() {
  printf '%s/infra/local/lib/ports.map' "${1:-$LWT_REPO_ROOT}"
}

# Reads ports.map into the arrays above. Validates that offsets are unique and
# inside the block — a duplicate offset would hand two processes the same port,
# which is the class of bug this whole system exists to prevent. Inherited
# verbatim from fintela's worktree.sh because it is already correct.
lwt_load_ports_map() {
  local map; map="$(lwt_ports_map_path "${1:-}")"
  [ -f "$map" ] || lwt_die "port map not found: $map"

  LWT_PORT_KEYS=(); LWT_PORT_OFFSETS=(); LWT_PORT_VARS=(); LWT_PORT_LABELS=()
  local -A seen_offset=() seen_key=()
  local key offset var label

  while read -r key offset var label; do
    [ -z "${key:-}" ] && continue
    case "$key" in '#'*) continue ;; esac

    [ -n "${offset:-}" ] && [ -n "${var:-}" ] \
      || lwt_die "ports.map: malformed line for '$key' (need: key offset VAR label)"
    case "$offset" in
      ''|*[!0-9]*) lwt_die "ports.map: offset for '$key' is not a number: '$offset'" ;;
    esac
    [ "$offset" -lt "$LWT_BLOCK_SIZE" ] \
      || lwt_die "ports.map: offset $offset for '$key' is outside the ${LWT_BLOCK_SIZE}-port block"
    [ -z "${seen_offset[$offset]:-}" ] \
      || lwt_die "ports.map: offset $offset is used by both '${seen_offset[$offset]}' and '$key'"
    [ -z "${seen_key[$key]:-}" ] || lwt_die "ports.map: duplicate key '$key'"
    seen_offset[$offset]="$key"; seen_key[$key]=1

    LWT_PORT_KEYS+=("$key")
    LWT_PORT_OFFSETS+=("$offset")
    LWT_PORT_VARS+=("$var")
    LWT_PORT_LABELS+=("${label:-$key}")
  done < <(sed 's/#.*//' "$map")

  [ "${#LWT_PORT_KEYS[@]}" -gt 0 ] || lwt_die "ports.map is empty: $map"
}

# ─── Port availability ───────────────────────────────────────────────────────

# All ports currently in LISTEN state, one per line. Collected once per run
# rather than per port: `ss` is cheap but N forks are not, and a snapshot keeps
# the whole block's verdict internally consistent.
lwt_listening_ports() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltnH 2>/dev/null | awk '{print $4}' | sed -E 's/.*:([0-9]+)$/\1/'
  elif command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null | awk 'NR>1 {print $9}' | sed -E 's/.*:([0-9]+)$/\1/'
  else
    lwt_warn "neither ss nor lsof found — cannot verify ports are free"
  fi
}

# Ports already handed to some OTHER worktree of THIS project, one per line. A
# port can be reserved with nothing listening (the dev server is simply
# stopped), so the registry is consulted as well as the kernel.
lwt_reserved_ports() {
  local exclude_slug="${1:-}" f slug
  [ -d "$LWT_REGISTRY_DIR" ] || return 0
  for f in "$LWT_REGISTRY_DIR"/*.env; do
    [ -e "$f" ] || continue
    slug="$(basename "$f" .env)"
    [ "$slug" = "$exclude_slug" ] && continue
    sed -n 's/^LWT_PORT_[A-Z0-9_]*=\([0-9]\+\)$/\1/p' "$f"
  done
}

lwt_used_slots() {
  local exclude_slug="${1:-}" f slug
  [ -d "$LWT_REGISTRY_DIR" ] || return 0
  for f in "$LWT_REGISTRY_DIR"/*.env; do
    [ -e "$f" ] || continue
    slug="$(basename "$f" .env)"
    [ "$slug" = "$exclude_slug" ] && continue
    sed -n 's/^LWT_SLOT=\([0-9]\+\)$/\1/p' "$f"
  done
}

# Echoes the first slot whose ENTIRE block is free, or fails loudly.
# "Free" is checked per port, not per slot: a slot nobody registered can still
# be unusable because an unrelated process squats one of its ports.
lwt_find_free_slot() {
  local exclude_slug="${1:-}"
  local -A busy=()
  local p slot base offset ok blocked_by

  while read -r p; do [ -n "$p" ] && busy[$p]=listening; done < <(lwt_listening_ports)
  while read -r p; do [ -n "$p" ] && busy[$p]="another worktree"; done < <(lwt_reserved_ports "$exclude_slug")

  local -A slot_taken=()
  while read -r slot; do [ -n "$slot" ] && slot_taken[$slot]=1; done < <(lwt_used_slots "$exclude_slug")

  for (( slot=0; slot<=LWT_MAX_SLOT; slot++ )); do
    [ -n "${slot_taken[$slot]:-}" ] && continue
    base=$(( LANDING_PORT_BASE + slot * LWT_BLOCK_SIZE ))
    ok=1; blocked_by=
    for offset in "${LWT_PORT_OFFSETS[@]}"; do
      p=$(( base + offset ))
      if [ -n "${busy[$p]:-}" ]; then
        ok=0; blocked_by="$p (${busy[$p]})"; break
      fi
    done
    if [ "$ok" = 1 ]; then
      printf '%s' "$slot"
      return 0
    fi
    lwt_warn "slot $slot (block $base-$((base + LWT_BLOCK_SIZE - 1))) is unusable: port $blocked_by — trying the next one" >&2
  done

  lwt_die "no free port block found in $LANDING_PORT_BASE..$(( LANDING_PORT_BASE + (LWT_MAX_SLOT+1)*LWT_BLOCK_SIZE - 1 )).
  Free some worktrees with 'make nuke', or move the range with LANDING_PORT_BASE=<port>."
}

# Re-checks an already-allocated block, so a stale allocation someone else's
# process has since squatted is reported rather than silently reused.
lwt_verify_block() {
  local slug="$1" base="$2" conflicts=0
  local -A busy=()
  local p offset

  while read -r p; do [ -n "$p" ] && busy[$p]="another worktree"; done < <(lwt_reserved_ports "$slug")

  for offset in "${LWT_PORT_OFFSETS[@]}"; do
    p=$(( base + offset ))
    if [ -n "${busy[$p]:-}" ]; then
      lwt_err "port $p is also reserved by another worktree"
      conflicts=$(( conflicts + 1 ))
    fi
  done
  [ "$conflicts" -eq 0 ] || lwt_die "$conflicts port conflict(s) in this worktree's block — run './setup_worktree.sh --prune' or re-allocate."
}

# ─── Registry ────────────────────────────────────────────────────────────────

lwt_registry_file() { printf '%s/%s.env' "$LWT_REGISTRY_DIR" "$1"; }

# Runs "$@" holding the registry lock, so two concurrent setup_worktree.sh runs
# cannot pick the same slot.
lwt_with_lock() {
  mkdir -p "$LANDING_HOME"
  if command -v flock >/dev/null 2>&1; then
    ( flock -w 60 9 || lwt_die "timed out waiting for the registry lock ($LWT_LOCK_FILE)"
      "$@"
    ) 9>"$LWT_LOCK_FILE"
  else
    lwt_warn "flock not found — concurrent setup_worktree.sh runs are unsafe on this machine"
    "$@"
  fi
}

lwt_load_registry() {
  local f; f="$(lwt_registry_file "$1")"
  [ -f "$f" ] || return 1
  # shellcheck disable=SC1090
  . "$f"
  return 0
}

# Writes the registry entry. Must be called under lwt_with_lock.
#
# $5 and $6 are how this worktree finds the product backend, remembered here so
# `--reconfigure` re-renders the same choice: the NAME of a product worktree
# (its port is looked up at render time, so it follows that worktree if it is
# ever re-slotted) or an explicit URL. Either may be empty.
lwt_write_registry() {
  local slug="$1" path="$2" slot="$3" base="$4" product="${5:-}" api_url="${6:-}"
  local f; f="$(lwt_registry_file "$slug")"
  local i

  mkdir -p "$LWT_REGISTRY_DIR"
  {
    echo "# fintela-landing worktree port reservation — generated by setup_worktree.sh"
    echo "# Deleting this file frees the slot. 'make nuke' does it for you."
    echo "LWT_SLUG=$slug"
    echo "LWT_PATH=$path"
    echo "LWT_SLOT=$slot"
    echo "LWT_PORT_BASE=$base"
    echo "LWT_PROJECT=$(lwt_project_name "$slug")"
    echo "LWT_PRODUCT_WORKTREE=$product"
    echo "LWT_API_URL=$api_url"
    for i in "${!LWT_PORT_KEYS[@]}"; do
      printf 'LWT_PORT_%s=%s\n' \
        "$(printf '%s' "${LWT_PORT_VARS[$i]}" | tr '[:lower:]-' '[:upper:]_')" \
        "$(( base + LWT_PORT_OFFSETS[i] ))"
    done
  } > "$f"
  chmod 600 "$f"
}

lwt_prune_registry() {
  local f slug path removed=0
  [ -d "$LWT_REGISTRY_DIR" ] || { lwt_ok "registry is empty — nothing to prune"; return 0; }
  for f in "$LWT_REGISTRY_DIR"/*.env; do
    [ -e "$f" ] || continue
    slug="$(basename "$f" .env)"
    path="$(sed -n 's/^LWT_PATH=//p' "$f" | head -1)"
    if [ -z "$path" ] || [ ! -d "$path" ] || [ ! -e "$path/.git" ]; then
      rm -f "$f"
      lwt_ok "pruned '$slug' (${path:-<no path>} is gone)"
      removed=$(( removed + 1 ))
    fi
  done
  [ "$removed" -eq 0 ] && lwt_ok "registry is clean — nothing to prune"
  return 0
}

# ─── Port accessors ──────────────────────────────────────────────────────────

# lwt_port <key> → the port this worktree assigned to that ports.map key.
lwt_port() {
  local want="$1" i
  [ -n "${LWT_PORT_BASE:-}" ] || lwt_die "lwt_port: no port block loaded (missing registry entry?)"
  for i in "${!LWT_PORT_KEYS[@]}"; do
    if [ "${LWT_PORT_KEYS[$i]}" = "$want" ]; then
      printf '%s' "$(( LWT_PORT_BASE + LWT_PORT_OFFSETS[i] ))"
      return 0
    fi
  done
  lwt_die "lwt_port: unknown key '$want' (not in infra/local/lib/ports.map)"
}

lwt_print_ports() {
  local i port
  printf '\n  %-14s %-6s %s\n' "KEY" "PORT" "WHAT"
  printf '  %-14s %-6s %s\n' "──────────────" "──────" "────"
  for i in "${!LWT_PORT_KEYS[@]}"; do
    port=$(( LWT_PORT_BASE + LWT_PORT_OFFSETS[i] ))
    printf '  %-14s %-6s %s\n' "${LWT_PORT_KEYS[$i]}" "$port" "${LWT_PORT_LABELS[$i]}"
  done
  printf '\n'
}

# ─── The product backend this worktree talks to ─────────────────────────────

# Backend port of a PRODUCT worktree, from ~/.fintela/worktrees/<name>.env —
# the same file the product's own tooling reads, so it can never disagree with
# `make ports` over there. Empty if that worktree is not configured.
lwt_product_backend_port() {
  local name="${1:?lwt_product_backend_port needs a worktree name}"
  local f="$LWT_PRODUCT_REGISTRY_DIR/$name.env"
  [ -f "$f" ] || return 1
  sed -n 's/^WT_PORT_BACKEND_PORT=\([0-9]\+\)$/\1/p' "$f" | head -1
}

# The URL the contact form POSTs to in `npm run dev`, or empty. An explicit URL
# wins; otherwise the named product worktree's backend; otherwise nothing —
# and NOTHING is the right answer: the SPA then fails visibly on submit instead
# of quietly filing a real request with the production backend.
lwt_resolve_api_url() {
  local product="${1:-}" api_url="${2:-}" port
  if [ -n "$api_url" ]; then
    printf '%s' "$api_url"; return 0
  fi
  [ -n "$product" ] || return 0
  if port="$(lwt_product_backend_port "$product")" && [ -n "$port" ]; then
    printf 'http://localhost:%s' "$port"; return 0
  fi
  lwt_warn "product worktree '$product' has no entry in $LWT_PRODUCT_REGISTRY_DIR — VITE_FINTELA_API left unset.
  Run ./setup_worktree.sh $product in ~/fintela/product/main, or pass --api <url>." >&2
  return 0
}

# ─── Rendering the generated config ──────────────────────────────────────────

# Replaces the marked block in $1 with the lines on stdin, preserving anything
# outside the markers. The block goes FIRST and its keys are stripped from the
# tail on every render: Vite's dotenv keeps the FIRST occurrence of a duplicate
# key and bash `source` keeps the LAST (deploy.sh sources .env.local), so a
# duplicate below the block would be dead in one consumer and live in the other.
lwt_write_block() {
  local file="$1" tmp keys
  tmp="$(mktemp)"
  local body; body="$(cat)"

  keys="$(printf '%s\n' "$body" | sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p')"

  {
    printf '%s\n' "$LWT_BLOCK_BEGIN"
    printf '%s\n' "$body"
    printf '%s\n' "$LWT_BLOCK_END"
    if [ -f "$file" ]; then
      # Everything that is not the old block and not a key we just wrote.
      sed -e "/^$(printf '%s' "$LWT_BLOCK_BEGIN" | sed 's/[][\.*^$/]/\\&/g')$/,/^$(printf '%s' "$LWT_BLOCK_END" | sed 's/[][\.*^$/]/\\&/g')$/d" "$file" \
        | { if [ -n "$keys" ]; then grep -vE "^($(printf '%s' "$keys" | paste -sd'|' -))=" || true; else cat; fi; }
    fi
  } > "$tmp"
  mv "$tmp" "$file"
  chmod 600 "$file"
}

# Which Vite env file gets what, and why there are TWO:
#
#   .env.local              read in EVERY mode — `vite` (development) AND
#                           `vite build` / `vite preview` (production). Only the
#                           PORTS go here. They are not VITE_-prefixed, so
#                           `loadEnv(mode, cwd, '')` in vite.config.ts sees them
#                           and the browser bundle never does.
#
#   .env.development.local  read ONLY in development mode, and the file with
#                           the highest precedence there. VITE_FINTELA_API —
#                           a localhost URL — goes here and nowhere else, so it
#                           cannot reach `npm run build` output. The same rule
#                           the product frontend uses.
lwt_render_config() {
  local target="$1" slug="$2"
  local web prev api_url
  web="$(lwt_port web)"; prev="$(lwt_port web-preview)"
  api_url="$(lwt_resolve_api_url "${LWT_PRODUCT_WORKTREE:-}" "${LWT_API_URL:-}")"

  mkdir -p "$target/.local"

  # ── .local/ports.env — fully generated, no markers, safe to clobber ────────
  {
    echo "# Generated by setup_worktree.sh. Do not edit; do not commit."
    echo "LWT_SLUG=$slug"
    echo "LWT_SLOT=$LWT_SLOT"
    echo "LWT_PORT_BASE=$LWT_PORT_BASE"
    echo "LWT_PROJECT=$(lwt_project_name "$slug")"
    local i
    for i in "${!LWT_PORT_KEYS[@]}"; do
      printf '%s=%s\n' "${LWT_PORT_VARS[$i]}" "$(( LWT_PORT_BASE + LWT_PORT_OFFSETS[i] ))"
    done
    echo "VITE_FINTELA_API=$api_url"
  } > "$target/.local/ports.env"

  # ── .env.local — managed block, hand-added tail survives ──────────────────
  # deploy.sh sources this file for S3_BUCKET / CLOUDFRONT_DISTRIBUTION; those
  # live in the tail, outside the markers, and survive every re-render.
  lwt_write_block "$target/.env.local" <<ENVEOF
# Ports (from infra/local/lib/ports.map — never hardcode one). Read by
# vite.config.ts only; not VITE_-prefixed, so they never reach the bundle.
WEB_PORT=$web
WEB_PREVIEW_PORT=$prev
ENVEOF

  # ── .env.development.local — dev-mode only, highest precedence ────────────
  if [ -n "$api_url" ]; then
    lwt_write_block "$target/.env.development.local" <<DEVEOF
# Where the contact form POSTs in \`npm run dev\`. Development only: \`vite build\`
# never reads this file, so this localhost URL cannot reach a production bundle.
VITE_FINTELA_API=$api_url
DEVEOF
  else
    # No product backend to point at: write the block EMPTY rather than leaving
    # a stale URL from a previous render in place.
    lwt_write_block "$target/.env.development.local" <<DEVEOF
# VITE_FINTELA_API is unset: no product worktree to point at. The contact form
# fails visibly on submit in dev. Re-run ./setup_worktree.sh --reconfigure
# --product <name> or --api <url>.
DEVEOF
  fi
}

# ─── Guards shared by the scripts ────────────────────────────────────────────

# True if something is listening on $1.
lwt_port_is_live() {
  local p="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltnH "sport = :$p" 2>/dev/null | grep -q .
  else
    (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null && exec 3<&- 3>&-
  fi
}

# Who holds $1, as "pid/comm", or empty. `|| true` because grep exits 1 on no
# match and this is called under `set -eo pipefail` in a command substitution.
lwt_port_holder() {
  ss -ltnpH "sport = :$1" 2>/dev/null \
    | grep -oE 'users:\(\("[^"]+",pid=[0-9]+' | head -1 \
    | sed -E 's/.*"([^"]+)",pid=([0-9]+)/\2\/\1/' || true
}
