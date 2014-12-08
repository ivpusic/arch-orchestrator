NODE ?= node
NPM ?= npm

test:
	@$(NPM) test

.PHONY: test
