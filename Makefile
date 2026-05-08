.PHONY: help cms-secret env-to-base64

help: ## Show available targets
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

cms-secret: ## Generate base64-encoded k8s secret data from apps/cms/.env
	@./scripts/env-to-base64.sh apps/cms/.env

env-to-base64: ## Usage: make env-to-base64 ENV=path/to/.env
	@if [ -z "$(ENV)" ]; then \
		echo "Usage: make env-to-base64 ENV=path/to/.env" >&2; \
		exit 1; \
	fi
	@./scripts/env-to-base64.sh "$(ENV)"
