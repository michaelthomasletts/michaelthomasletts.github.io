.PHONY: dev

dev:
	@echo "Starting Hugo in development mode (Google Analytics disabled)"
	HUGO_ENVIRONMENT=development HUGO_ENV=development hugo server --environment development
