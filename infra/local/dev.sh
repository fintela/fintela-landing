#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev.sh — run this worktree's dev server on ITS port.
#
# There is one process, so unlike the product's supervisor it runs in the
# FOREGROUND: Vite's own output is what you want to see, and Ctrl+C is the stop.
# `make nuke` finds a server this left behind by PORT, not by pid.
#
#   make dev             the Vite dev server (npm ci first if node_modules is missing)
#   make preview         `vite preview` — the production build, served locally
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=infra/local/lib/worktree.sh
. "$ROOT/infra/local/lib/worktree.sh"
LWT_REPO_ROOT="$ROOT"
lwt_load_ports_map "$ROOT"
[ -f "$ROOT/.local/ports.env" ] || lwt_die "no .local/ports.env — run './setup_worktree.sh --reconfigure'"
# shellcheck disable=SC1091
. "$ROOT/.local/ports.env"

WHAT="${1:-dev}"
case "$WHAT" in
  dev)     PORT="$WEB_PORT";         SCRIPT="dev" ;;
  preview) PORT="$WEB_PREVIEW_PORT"; SCRIPT="preview" ;;
  *)       lwt_die "usage: dev.sh [dev|preview]" ;;
esac

if lwt_port_is_live "$PORT"; then
  lwt_die "port $PORT is already in use by $(lwt_port_holder "$PORT") — is this worktree's server already running?
  'make nuke' stops it; another worktree's server means its slot collides (run ./setup_worktree.sh --list)."
fi

if [ ! -d "$ROOT/node_modules" ]; then
  lwt_log "node_modules is missing — running npm ci"
  (cd "$ROOT" && npm ci)
fi

if [ "$WHAT" = dev ]; then
  if [ -n "${VITE_FINTELA_API:-}" ]; then
    lwt_dim "contact form → $VITE_FINTELA_API"
  else
    lwt_warn "VITE_FINTELA_API is unset — the contact form will fail on submit (by design; see docs/LOCAL_WORKTREES.md)"
  fi
fi

lwt_log "starting $SCRIPT on http://localhost:$PORT"
cd "$ROOT"
# Vite reads WEB_PORT / WEB_PREVIEW_PORT from .env.local (see vite.config.ts);
# passing it on the command line as well makes this script's promise explicit.
exec npm run "$SCRIPT" -- --port "$PORT" --strictPort
