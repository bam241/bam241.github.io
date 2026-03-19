SHELL := /bin/bash

JEKYLL         := bundle exec jekyll
JEKYLL_FLAGS   := --livereload --drafts --trace
JEKYLL_CONFIGS := _config.yml
DEV_CONFIG     := _config_dev.yml
LOCAL_URL      := http://127.0.0.1:4000

ifneq ("$(wildcard $(DEV_CONFIG))","")
  JEKYLL_CONFIGS := _config.yml,$(DEV_CONFIG)
endif

.DEFAULT_GOAL := help
.PHONY: help check install install-ruby install-node build build-js build-timeline build-jekyll serve watch-js clean purge rebuild setup open

help:
	@echo ''
	@echo 'Jekyll Chirpy - Local Development'
	@echo '-----------------------------------------'
	@printf '  %-22s %s\n' 'make setup'       'Full first-time setup'
	@printf '  %-22s %s\n' 'make install'     'Install Ruby + Node dependencies'
	@printf '  %-22s %s\n' 'make build'       'Build JS assets + Jekyll site'
	@printf '  %-22s %s\n' 'make build-timeline' 'Build timeline JS only'
	@printf '  %-22s %s\n' 'make serve'       'Serve site locally with live reload'
	@printf '  %-22s %s\n' 'make clean'       'Remove generated site files'
	@printf '  %-22s %s\n' 'make purge'       'Clean and remove node_modules and vendor'
	@printf '  %-22s %s\n' 'make rebuild'     'Clean + build + serve'
	@printf '  %-22s %s\n' 'make watch-js'    'Watch and rebuild JS assets on change'
	@printf '  %-22s %s\n' 'make check'       'Verify all required tools are installed'
	@printf '  %-22s %s\n' 'make open'        'Open the local site in your browser'
	@echo ''

check:
	@echo ''
	@echo 'Checking required tools...'
	@echo ''
	@command -v ruby   >/dev/null 2>&1 && echo '  OK  ruby'    || { echo '  !!  ruby NOT FOUND'; exit 1; }
	@command -v bundle >/dev/null 2>&1 && echo '  OK  bundler' || { echo '  !!  bundler NOT FOUND - run: gem install bundler'; exit 1; }
	@command -v node   >/dev/null 2>&1 && echo '  OK  node'    || { echo '  !!  node NOT FOUND - run: brew install node'; exit 1; }
	@command -v npm    >/dev/null 2>&1 && echo '  OK  npm'     || { echo '  !!  npm NOT FOUND'; exit 1; }
	@command -v rake   >/dev/null 2>&1 && echo '  OK  rake'    || { echo '  !!  rake NOT FOUND - run: gem install rake'; exit 1; }
	@echo ''
	@echo '  All checks passed.'
	@echo ''

install: install-ruby install-node
	@echo 'All dependencies installed.'

install-ruby:
	@echo 'Installing Ruby gems...'
	bundle install
	@mkdir -p vendor
	@touch vendor/.bundle-installed

install-node:
	@echo 'Installing Node packages...'
	npm install
	@touch node_modules/.npm-installed

build: build-js build-timeline build-jekyll

build-js:
	@echo 'Building JavaScript assets...'
	npm run build

build-timeline:
	@echo 'Building timeline JavaScript...'
	rake js:build

build-jekyll:
	@echo 'Building Jekyll site...'
	JEKYLL_ENV=development $(JEKYLL) build --config $(JEKYLL_CONFIGS)

serve:
	@echo ''
	@echo 'Starting Jekyll development server'
	@echo 'URL -> $(LOCAL_URL)'
	@echo 'Tip: run make watch-js in a second terminal when editing JS'
	@echo ''
	JEKYLL_ENV=development $(JEKYLL) serve --config $(JEKYLL_CONFIGS) $(JEKYLL_FLAGS)

watch-js:
	@echo 'Watching JavaScript assets...'
	npm run watch

clean:
	@echo 'Cleaning...'
	$(JEKYLL) clean
	@rm -rf assets/js/dist
	@echo 'Done'

purge: clean
	@rm -rf node_modules
	@rm -rf vendor
	@echo 'Purged. Run make setup to reinstall.'

rebuild: clean build serve

setup: check install build
	@echo 'Setup complete - run make serve'

open:
	@open $(LOCAL_URL) 2>/dev/null || echo 'Visit: $(LOCAL_URL)'