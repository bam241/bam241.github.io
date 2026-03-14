# ============================================================
#  Makefile — Jekyll Chirpy local development
#  Usage: make <target>
# ============================================================

SHELL := /bin/bash

# ── Colours ──────────────────────────────────────────────────
RESET   := \033[0m
BOLD    := \033[1m
GREEN   := \033[32m
YELLOW  := \033[33m
CYAN    := \033[36m
RED     := \033[31m

# ── Config ───────────────────────────────────────────────────
JEKYLL          := bundle exec jekyll
JEKYLL_FLAGS    := --livereload --drafts --trace
JEKYLL_CONFIGS  := _config.yml
DEV_CONFIG      := _config_dev.yml
LOCAL_URL       := http://127.0.0.1:4000

# Use dev config overlay if it exists
ifneq ("$(wildcard $(DEV_CONFIG))","")
  JEKYLL_CONFIGS := _config.yml,$(DEV_CONFIG)
endif

# ── Default target ───────────────────────────────────────────
.DEFAULT_GOAL := help

# ── Phony targets ────────────────────────────────────────────
.PHONY: help install install-ruby install-node build build-js build-css \
        serve clean purge rebuild check open watch-js setup

# ============================================================
#  HELP
# ============================================================
help:
	@echo ""
	@echo "  $(BOLD)$(CYAN)Jekyll Chirpy — Local Development$(RESET)"
	@echo "  ─────────────────────────────────────────"
	@printf "  $(GREEN<span class="ml-2" /><span class="inline-block w-3 h-3 rounded-full bg-neutral-a12 align-middle mb-[0.1rem]" />