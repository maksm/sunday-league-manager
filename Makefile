# Makefile for Local CI/CD

.PHONY: all ci lint format format-check test build help

# Default target
all: help

# Help command
help:
	@echo "Available commands:"
	@echo "  make ci           - Run full CI pipeline (lint, format-check, test, build)"
	@echo "  make lint         - Run ESLint"
	@echo "  make format       - Format code with Prettier"
	@echo "  make format-check - Check code formatting"
	@echo "  make test         - Run tests"
	@echo "  make build        - Build application"
	@echo "  make install      - Install dependencies"

# Install dependencies
install:
	npm ci

# Run full CI pipeline
ci: lint format-check test e2e build
	@echo "✅ CI Pipeline Passed!"

# Linting
lint:
	@echo "🔍 Running Lint..."
	npm run lint

# Formatting
format:
	@echo "✨ Formatting Code..."
	npm run format

# Check Formatting
format-check:
	@echo "🔍 Checking Formatting..."
	npm run format:check

# Testing
test:
	@echo "🧪 Running Tests..."
	npm test

# E2E Testing
e2e:
	@echo "🎭 Running E2E Tests..."
	npx playwright install --with-deps chromium firefox webkit
	npm run test:e2e

# Building
build:
	@echo "🏗️ Building Application..."
	DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
	DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm run build

# Clean
clean:
	rm -rf .next
	rm -rf node_modules
	rm -rf coverage
