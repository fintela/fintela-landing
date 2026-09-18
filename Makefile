# ═══════════════════════════════════════════════════════════════════════════
#  fintela-landing — the local CLI.
#
#  A static site: no database, no container, no secret. Development is:
#      make dev        the Vite dev server on THIS worktree's port
#      make check      what CI runs (tsc, build, i18n key parity, docs links,
#                      prerender/SEO output, CloudFront router test)
#      make deploy     build + upload to S3 + invalidate (deploy.sh; needs creds)
#
#  Ports come from infra/local/lib/ports.map via .local/ports.env. NEVER
#  hardcode one — `make ports` prints this worktree's block.
# ═══════════════════════════════════════════════════════════════════════════
SHELL := /usr/bin/env bash
.DEFAULT_GOAL := help

# This worktree's ports. Absent before the first ./setup_worktree.sh, hence '-'.
-include .local/ports.env

NUKE_ARGS ?=

.PHONY: help setup ports nuke dev preview build deploy check tsc-check i18n-check docs-links-check content-check media-check seo-check router-test lint deps

help:
	@echo ''
	@echo '  fintela-landing — the public site, docs and blog'
	@echo ''
	@echo '  SETUP     setup · ports · nuke'
	@echo '  RUN       dev · preview · build · deploy'
	@echo '  CHECK     check (= what CI runs) · tsc-check · i18n-check · docs-links-check · content-check · media-check · seo-check · router-test · lint'
	@echo ''
	@echo "  This worktree: ports $(LWT_PORT_BASE)-$$(( $(LWT_PORT_BASE) + 9 ))   (make ports)"
	@echo "  Contact form → $(if $(VITE_FINTELA_API),$(VITE_FINTELA_API),unset — submit fails visibly in dev)"
	@echo ''

# ── Setup ──────────────────────────────────────────────────────────────────
setup:
	@./setup_worktree.sh --reconfigure

ports:
	@./setup_worktree.sh --list

nuke:
	@bash infra/local/nuke.sh $(NUKE_ARGS)

# ── Run ────────────────────────────────────────────────────────────────────
dev:
	@bash infra/local/dev.sh dev

# The production build, served locally on this worktree's preview port. It is
# a PRODUCTION bundle: the contact form in it talks to the real backend.
preview: build
	@bash infra/local/dev.sh preview

build: deps
	@npm run build

# What CI does on a push to main, from this machine: build, then
# scripts/sync-site.sh (per-class cache headers, one `/*` invalidation).
# Reads S3_BUCKET / CLOUDFRONT_DISTRIBUTION from .env.local; `aws login` first.
deploy:
	@./deploy.sh

# `npm ci` exactly when package-lock.json is newer than what is installed —
# a fresh worktree has no node_modules at all, and CI runs `npm ci` first too.
deps: node_modules/.package-lock.json
node_modules/.package-lock.json: package-lock.json
	@npm ci

# ── Checks ─────────────────────────────────────────────────────────────────
# The same steps as .github/workflows/ci.yml, in the same order.
check: tsc-check lint build i18n-check docs-links-check content-check media-check seo-check router-test

tsc-check: deps
	@npx tsc -b

i18n-check:
	@node scripts/i18n-keysync.mjs

docs-links-check: build
	@node scripts/check-docs-links.mjs

# Content hygiene: no hot-linked images or placeholder alt text, no links to
# redirecting paths, every referenced cover published.
content-check: build
	@node scripts/check-content.mjs

# Every mediaUrl() in src/media/registry.ts resolves to a file under public/media.
media-check:
	@node scripts/check-media.mjs

# The prerendered output: every route has its HTML, one <h1>, canonical,
# description, OG image, valid JSON-LD; sitemaps list only real pages.
seo-check: build
	@node scripts/check-seo-output.mjs

# The CloudFront viewer-request router (infra/cloudfront/router.js), including
# the assertion that its redirect maps equal the ones in src/App.tsx.
router-test:
	@node --test infra/cloudfront/router.test.mjs

# Gated by CI (it runs right after the typecheck).
lint: deps
	@npm run lint
