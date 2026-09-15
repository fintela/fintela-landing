#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup_worktree.sh — create a git worktree that can run the landing site
# locally, at the same time as every other worktree.
#
#   ./setup_worktree.sh <name> [<base-branch>]   create ../<name>
#   ./setup_worktree.sh --reconfigure            repair THIS worktree's config
#   ./setup_worktree.sh --list                   show every worktree's ports
#   ./setup_worktree.sh --prune                  free slots of deleted worktrees
#
#   --product <name>        which PRODUCT worktree's backend the contact form
#                           talks to in dev (default: main). Its port is read
#                           from ~/.fintela/worktrees/<name>.env, never typed.
#   --api <url>             point the contact form at an explicit URL instead
#   --no-api                leave VITE_FINTELA_API unset (submit fails visibly)
#   --base-port <n>         move the port envelope (default 11000)
#
# Run it from your main checkout (~/fintela/landing/main); the new worktree
# lands beside it. It assigns the worktree a block of 10 ports and writes the
# generated config. Nothing needs to be set by hand afterwards:
#
#   ./setup_worktree.sh feature-x
#   cd ../feature-x
#   make dev         # the site on this worktree's port
#
# Idempotent — running it again on a configured worktree re-renders the same
# values rather than allocating new ones.
#
# NOTE there is no database, no build cache and no secret to clone: this is a
# static site. The one thing it reaches is the product backend (the contact
# form), and only in the sense of knowing its port.
#
# Design notes: docs/LOCAL_WORKTREES.md
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=infra/local/lib/worktree.sh
. "$SCRIPT_DIR/infra/local/lib/worktree.sh"

usage() {
  sed -n '3,30p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

NAME=""; BASE=""; MODE="create"
# Empty means "nobody said": on create it defaults to main, on --reconfigure it
# keeps whatever the registry remembers.
PRODUCT=""; API_URL=""; API_SET=0
while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help)       usage 0 ;;
    --reconfigure)   MODE="reconfigure" ;;
    --list)          MODE="list" ;;
    --prune)         MODE="prune" ;;
    --product)       shift; PRODUCT="${1:?--product needs a worktree name}"; API_SET=1 ;;
    --product=*)     PRODUCT="${1#*=}"; API_SET=1 ;;
    --api)           shift; API_URL="${1:?--api needs a URL}"; API_SET=1 ;;
    --api=*)         API_URL="${1#*=}"; API_SET=1 ;;
    --no-api)        PRODUCT=""; API_URL=""; API_SET=1 ;;
    --base-port)     shift; LANDING_PORT_BASE="${1:?--base-port needs a number}"; lwt_validate_range ;;
    --base-port=*)   LANDING_PORT_BASE="${1#*=}"; lwt_validate_range ;;
    -*)              lwt_die "unknown option: $1 (try --help)" ;;
    *)
      if   [ -z "$NAME" ]; then NAME="$1"
      elif [ -z "$BASE" ]; then BASE="$1"
      else lwt_die "too many arguments (try --help)"; fi ;;
  esac
  shift
done

# ─── --prune needs no worktree of its own ────────────────────────────────────

if [ "$MODE" = "prune" ]; then
  lwt_with_lock lwt_prune_registry
  exit 0
fi

SOURCE_ROOT="$(lwt_repo_root "$SCRIPT_DIR")" || true
[ -n "${SOURCE_ROOT:-}" ] || lwt_die "not inside a git repository — run this from your main checkout (e.g. ~/fintela/landing/main)."
LWT_REPO_ROOT="$SOURCE_ROOT"
lwt_load_ports_map "$SOURCE_ROOT"

if [ "$MODE" = "list" ]; then
  if [ ! -d "$LWT_REGISTRY_DIR" ] || [ -z "$(ls -A "$LWT_REGISTRY_DIR" 2>/dev/null)" ]; then
    lwt_ok "no worktrees configured yet"
    exit 0
  fi
  printf '\n  %-24s %-5s %-13s %-18s %s\n' "WORKTREE" "SLOT" "PORT BLOCK" "BACKEND" "PATH"
  printf '  %-24s %-5s %-13s %-18s %s\n' "────────────────────────" "─────" "─────────────" "──────────────────" "────"
  for f in "$LWT_REGISTRY_DIR"/*.env; do
    [ -e "$f" ] || continue
    ( # subshell: each entry sourced in isolation
      # shellcheck disable=SC1090
      . "$f"
      status=""; [ -d "${LWT_PATH:-}" ] || status=" ${_C_YLW}(missing — run --prune)${_C_OFF}"
      backend="${LWT_API_URL:-${LWT_PRODUCT_WORKTREE:+product/$LWT_PRODUCT_WORKTREE}}"
      printf '  %-24s %-5s %-13s %-18s %s%s\n' "$LWT_SLUG" "$LWT_SLOT" \
        "$LWT_PORT_BASE-$(( LWT_PORT_BASE + LWT_BLOCK_SIZE - 1 ))" "${backend:--}" "${LWT_PATH:-?}" "$status"
    )
  done
  printf '\n'
  exit 0
fi

# ─── Locate (or create) the target worktree ──────────────────────────────────

if [ "$MODE" = "reconfigure" ]; then
  if [ -n "$NAME" ]; then
    TARGET="$(dirname "$SOURCE_ROOT")/$NAME"
  else
    TARGET="$(lwt_repo_root "$PWD")" || lwt_die "--reconfigure must run inside a git worktree"
  fi
  [ -d "$TARGET" ] || lwt_die "no such worktree: $TARGET"
else
  [ -n "$NAME" ] || usage 1
  case "$NAME" in
    */*|.|..) lwt_die "worktree name must be a plain directory name, got '$NAME'" ;;
  esac
  TARGET="$(dirname "$SOURCE_ROOT")/$NAME"
fi

TARGET="$(cd "$TARGET" 2>/dev/null && pwd || printf '%s' "$TARGET")"
SLUG="$(lwt_slug "$TARGET")"
[ -n "$SLUG" ] || lwt_die "could not derive a slug from '$TARGET'"

if [ "$MODE" = "create" ] && [ ! -e "$TARGET" ]; then
  lwt_log "Creating worktree $TARGET"
  if git -C "$SOURCE_ROOT" show-ref --verify --quiet "refs/heads/$NAME"; then
    [ -z "$BASE" ] || lwt_warn "branch '$NAME' already exists — ignoring base '$BASE'"
    git -C "$SOURCE_ROOT" worktree add "$TARGET" "$NAME"
  elif git -C "$SOURCE_ROOT" ls-remote --exit-code --heads origin "$NAME" >/dev/null 2>&1; then
    lwt_dim "branch exists on origin — checking it out with tracking"
    git -C "$SOURCE_ROOT" fetch --quiet origin "$NAME"
    git -C "$SOURCE_ROOT" worktree add --track -b "$NAME" "$TARGET" "origin/$NAME"
  else
    if [ -z "$BASE" ]; then
      if git -C "$SOURCE_ROOT" show-ref --verify --quiet refs/heads/main; then BASE=main
      else BASE="$(git -C "$SOURCE_ROOT" rev-parse --abbrev-ref HEAD)"; fi
    fi
    lwt_dim "creating new branch '$NAME' from '$BASE'"
    git -C "$SOURCE_ROOT" worktree add -b "$NAME" "$TARGET" "$BASE"
  fi
  lwt_ok "worktree created"
elif [ "$MODE" = "create" ]; then
  lwt_dim "$TARGET already exists — reconfiguring it instead of creating it"
fi

[ -d "$TARGET" ] || lwt_die "worktree directory was not created: $TARGET"
[ -e "$TARGET/.git" ] || lwt_die "$TARGET is not a git worktree"

if [ ! -f "$TARGET/infra/local/lib/worktree.sh" ]; then
  lwt_warn "$TARGET does not contain infra/local/lib/worktree.sh — its branch predates
  the per-worktree local environment. Config is still written, but 'make dev'
  there will not work until you merge the branch that adds it."
fi

# ─── Allocate (or reuse) the port block ──────────────────────────────────────

allocate() {
  local product="$PRODUCT" api_url="$API_URL"
  if lwt_load_registry "$SLUG"; then
    if [ "${LWT_PATH:-}" != "$TARGET" ]; then
      lwt_die "slug '$SLUG' is already registered to a different path:
  registered: $LWT_PATH
  requested : $TARGET
  Rename the directory, or free the old entry with --prune / 'make nuke'."
    fi
    lwt_verify_block "$SLUG" "$LWT_PORT_BASE"
    # Nobody said which backend this time: keep what the registry remembers.
    if [ "$API_SET" = 0 ]; then
      product="${LWT_PRODUCT_WORKTREE:-}"; api_url="${LWT_API_URL:-}"
    fi
    lwt_write_registry "$SLUG" "$TARGET" "$LWT_SLOT" "$LWT_PORT_BASE" "$product" "$api_url"
    lwt_ok "reusing slot $LWT_SLOT (ports $LWT_PORT_BASE-$(( LWT_PORT_BASE + LWT_BLOCK_SIZE - 1 )))"
  else
    local slot base
    slot="$(lwt_find_free_slot "$SLUG")"
    base=$(( LANDING_PORT_BASE + slot * LWT_BLOCK_SIZE ))
    # A fresh worktree with nothing said points at the product's main checkout.
    if [ "$API_SET" = 0 ]; then product="main"; fi
    lwt_write_registry "$SLUG" "$TARGET" "$slot" "$base" "$product" "$api_url"
    lwt_load_registry "$SLUG"
    lwt_ok "assigned slot $slot (ports $base-$(( base + LWT_BLOCK_SIZE - 1 )))"
  fi
}
lwt_with_lock allocate
# The allocation happened in a subshell; re-read it here.
lwt_load_registry "$SLUG" || lwt_die "registry entry for '$SLUG' vanished"

# ─── Render the generated config ─────────────────────────────────────────────

lwt_log "Writing configuration"
lwt_render_config "$TARGET" "$SLUG"
lwt_ok "wrote .env.local, .env.development.local, .local/ports.env"

# ─── Report ──────────────────────────────────────────────────────────────────

API_SHOWN="$(sed -n 's/^VITE_FINTELA_API=//p' "$TARGET/.local/ports.env")"
cat <<EOF

$(printf '%s' "$_C_GRN")Worktree '$SLUG' is configured.$(printf '%s' "$_C_OFF")

  path       $TARGET
  slot       $LWT_SLOT   (port block $LWT_PORT_BASE-$(( LWT_PORT_BASE + LWT_BLOCK_SIZE - 1 )))
  backend    ${API_SHOWN:-(unset — the contact form fails visibly in dev)}${LWT_PRODUCT_WORKTREE:+   ← product worktree '$LWT_PRODUCT_WORKTREE'}
EOF
lwt_print_ports

cat <<EOF
Next:
  cd $TARGET
  make dev       # the site on the port above (runs npm ci first if needed)

  make ports     # print this table again
  make check     # what CI runs: tsc, build, i18n key parity, docs links
  make nuke      # stop the dev server + free the slot before deleting the worktree

EOF
