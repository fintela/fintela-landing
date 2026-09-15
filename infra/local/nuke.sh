#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# nuke.sh — stop this worktree's dev server, delete its generated config, and
# free its slot. Run before `git worktree remove`.
#
#   make nuke                       the whole thing, no questions asked
#   make nuke NUKE_ARGS=--force     also allowed inside the main checkout
#
# It refuses to run in `main/` unless forced: main is the checkout every
# setup_worktree.sh and deploy starts from, and nuking it drops its port slot —
# recoverable with `./setup_worktree.sh --reconfigure`, but never what anyone
# meant.
#
# node_modules and dist are left alone: they are `git clean -x`'s business, and
# an `npm ci` is the slow part of coming back.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=infra/local/lib/worktree.sh
. "$ROOT/infra/local/lib/worktree.sh"
LWT_REPO_ROOT="$ROOT"
lwt_load_ports_map "$ROOT"

FORCE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --force)   FORCE=1 ;;
    -h|--help) sed -n '3,15p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)         lwt_die "unknown option: $1 (try --help)" ;;
  esac
  shift
done

SLUG="$(lwt_slug "$ROOT")"

# The guard keys on the directory name, not on an absolute path, so it survives
# the checkout being moved.
if [ "$(basename "$ROOT")" = main ] && [ "$FORCE" = 0 ]; then
  lwt_die "refusing to nuke the main checkout ($ROOT).
  It is the one you run setup_worktree.sh and the deploys from. Pass --force if you really mean it."
fi

if [ -f "$ROOT/.local/ports.env" ]; then
  # shellcheck disable=SC1091
  . "$ROOT/.local/ports.env"
else
  lwt_load_registry "$SLUG" || true
  [ -n "${LWT_PORT_BASE:-}" ] || lwt_warn "this worktree has no port assignment — nothing to stop"
fi

# Stop by PORT: the dev server runs in the foreground with no pidfile, so the
# port is the only durable handle on it.
if [ -n "${LWT_PORT_BASE:-}" ]; then
  lwt_log "stopping anything on this worktree's ports"
  for key in "${LWT_PORT_KEYS[@]}"; do
    p="$(lwt_port "$key")"
    holder="$(lwt_port_holder "$p")"
    [ -n "$holder" ] || continue
    pid="${holder%%/*}"
    kill -TERM "$pid" 2>/dev/null || true
    for _ in 1 2 3; do lwt_port_is_live "$p" || break; sleep 1; done
    lwt_port_is_live "$p" && kill -KILL "$pid" 2>/dev/null || true
    lwt_dim "$key ($p) stopped — was $holder"
  done
fi

lwt_log "removing generated config"
rm -rf "$ROOT/.local"
# Only the managed block is ours; the tail of .env.local may hold deploy.sh's
# S3_BUCKET / CLOUDFRONT_DISTRIBUTION. Strip the block, keep the rest, and
# remove the file only if nothing is left.
begin_re="$(printf '%s' "$LWT_BLOCK_BEGIN" | sed 's/[][\.*^$/]/\\&/g')"
end_re="$(printf '%s' "$LWT_BLOCK_END"   | sed 's/[][\.*^$/]/\\&/g')"
for f in .env.local .env.development.local; do
  [ -f "$ROOT/$f" ] || continue
  sed -i -e "/^$begin_re$/,/^$end_re$/d" "$ROOT/$f"
  if grep -q '[^[:space:]]' "$ROOT/$f"; then
    lwt_dim "$f: kept your hand-added lines"
  else
    rm -f "$ROOT/$f"
  fi
done

lwt_log "freeing the registry slot"
lwt_with_lock rm -f "$(lwt_registry_file "$SLUG")"

lwt_ok "worktree '$SLUG' is nuked."
lwt_dim "next: cd .. && git worktree remove $SLUG"
